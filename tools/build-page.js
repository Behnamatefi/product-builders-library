#!/usr/bin/env node
/* ============================================================================
   tools/build-page.js — assemble a book page shell from a DATA payload
   ----------------------------------------------------------------------------
   Every book page in this library is a thin shell around one inline
   Book.mount(DATA) object (see CLAUDE.md → "How a book page works"). This tool
   takes a standalone DATA object as JSON and emits the page:

       node tools/build-page.js path/to/<slug>.json [...more.json]

   It writes to  "<meta.folder>/<meta.slug>.html"  relative to the repo root,
   creating the group folder if needed, and refuses to write a payload that
   breaks the invariants book.js depends on.

   Idempotent: re-running with the same JSON reproduces the same page byte for
   byte, so this is also the safe way to re-emit pages after a shell change.

   After adding pages, remember:
       node tools/build-manifest.js     # refresh assets/library.js
       node tools/build-atlas.js        # refresh assets/atlas.js
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TONES = ['--c-teal', '--c-blue', '--c-violet', '--c-amber'];

/* ── validation ──────────────────────────────────────────────────────────── */

/* Walks the payload and collects every problem, so one run reports them all
   rather than failing on the first. `where` is a dotted path for the message. */
function validate(d) {
  const errs = [];
  const bad = (where, msg) => errs.push(`${where}: ${msg}`);

  /* a bilingual node must carry both languages, and neither may be blank */
  const pair = (v, where) => {
    if (!v || typeof v !== 'object') return bad(where, 'missing bilingual {en, fa}');
    for (const lang of ['en', 'fa']) {
      if (typeof v[lang] !== 'string' || !v[lang].trim()) bad(where, `empty "${lang}"`);
    }
  };

  const m = d.meta || {};
  if (!m.slug) bad('meta.slug', 'required');
  if (!m.folder) bad('meta.folder', 'required');
  if (typeof m.groupNum !== 'number') bad('meta.groupNum', 'must be a number');
  if (m.folder && m.groupNum && parseInt(m.folder, 10) !== m.groupNum) {
    bad('meta.folder', `"${m.folder}" disagrees with groupNum ${m.groupNum}`);
  }
  ['group', 'author', 'eyebrow_author', 'book', 'hero_title', 'dek', 'published']
    .forEach(k => pair(m[k], `meta.${k}`));

  const arr = (v, n, where) => {
    if (!Array.isArray(v)) { bad(where, 'must be an array'); return false; }
    if (v.length !== n) { bad(where, `expected ${n} entries, got ${v.length}`); return false; }
    return true;
  };

  arr(m.chips, 3, 'meta.chips');
  arr(m.kboxes, 4, 'meta.kboxes');
  arr(d.tldr, 5, 'tldr') && d.tldr.forEach((t, i) => pair(t, `tldr[${i}]`));
  arr(d.quotes, 6, 'quotes') && d.quotes.forEach((q, i) => pair(q, `quotes[${i}]`));
  arr(d.media, 2, 'media');
  arr(d.go, 3, 'go');
  arr(d.stages, 5, 'stages');

  /* the graph draws parts + chapters + one core node; book.js assumes 4 + 12 */
  const parts = Array.isArray(d.parts) ? d.parts : [];
  const chapters = d.chapters && typeof d.chapters === 'object' ? d.chapters : {};
  if (parts.length !== 4) bad('parts', `expected 4 parts, got ${parts.length}`);
  const chapterCount = Object.keys(chapters).length;
  if (chapterCount !== 12) bad('chapters', `expected 12 chapters, got ${chapterCount}`);

  const partKeys = new Set();
  parts.forEach((p, i) => {
    if (!p.key) bad(`parts[${i}].key`, 'required');
    if (partKeys.has(p.key)) bad(`parts[${i}].key`, `duplicate "${p.key}"`);
    partKeys.add(p.key);
    if (p.varc !== TONES[i]) bad(`parts[${i}].varc`, `expected ${TONES[i]}, got ${p.varc}`);
    ['name', 'tag', 'gist', 'more'].forEach(k => pair(p[k], `parts[${i}].${k}`));
    if (!Array.isArray(p.chapters) || p.chapters.length !== 3) {
      bad(`parts[${i}].chapters`, 'expected 3 chapter keys');
    } else {
      p.chapters.forEach(ck => {
        if (!chapters[ck]) bad(`parts[${i}].chapters`, `unknown chapter "${ck}"`);
        else if (chapters[ck].part !== p.key) {
          bad(`chapters.${ck}.part`, `is "${chapters[ck].part}", expected "${p.key}"`);
        }
      });
    }
  });

  /* chapter numbering drives reading order and the stage rail, so it must be
     a clean 1..12 with no gaps or repeats */
  const seen = new Map();
  Object.entries(chapters).forEach(([k, c]) => {
    ['name', 'glabel', 'principle', 'more', 'example', 'tip', 'pitfall']
      .forEach(f => pair(c[f], `chapters.${k}.${f}`));
    if (!Number.isInteger(c.n) || c.n < 1 || c.n > 12) bad(`chapters.${k}.n`, `out of range: ${c.n}`);
    else if (seen.has(c.n)) bad(`chapters.${k}.n`, `duplicate of chapters.${seen.get(c.n)}`);
    else seen.set(c.n, k);
  });
  for (let n = 1; n <= 12; n++) if (!seen.has(n)) bad('chapters', `no chapter numbered ${n}`);

  ['name', 'principle', 'more', 'example'].forEach(k => pair((d.core || {})[k], `core.${k}`));

  (d.stages || []).forEach((s, i) => {
    if (s.level !== i + 1) bad(`stages[${i}].level`, `expected ${i + 1}, got ${s.level}`);
    ['badge', 'title', 'tagline', 'body', 'example', 'gain']
      .forEach(k => pair(s[k], `stages[${i}].${k}`));
  });

  (d.media || []).forEach((x, i) => {
    if (!/^https?:\/\//.test(x.url || '')) bad(`media[${i}].url`, 'must be an absolute http(s) url');
    ['src', 'title', 'desc', 'best'].forEach(k => pair(x[k], `media[${i}].${k}`));
    ['en', 'fa'].forEach(l => {
      const b = (x.bullets || {})[l];
      if (!Array.isArray(b) || b.length !== 3) bad(`media[${i}].bullets.${l}`, 'expected 3 bullets');
    });
  });

  (d.go || []).forEach((g, i) => {
    if (!/^https?:\/\//.test(g.url || '')) bad(`go[${i}].url`, 'must be an absolute http(s) url');
    pair(g.label, `go[${i}].label`);
  });

  /* the recommendations rail renders two "best" cards then two "next" cards */
  const pris = (d.recs || []).map(r => r.pri).join(',');
  if (pris !== 'b,b,n,n') bad('recs', `expected pri sequence b,b,n,n — got ${pris || '(none)'}`);
  (d.recs || []).forEach((r, i) => { pair(r.t, `recs[${i}].t`); pair(r.d, `recs[${i}].d`); });

  pair(d.method, 'method');
  ['en', 'fa'].forEach(l => {
    const f = (d.flow || {})[l];
    if (!Array.isArray(f) || !f.length) bad(`flow.${l}`, 'expected a non-empty array of words');
  });
  if (d.flow && Array.isArray(d.flow.en) && Array.isArray(d.flow.fa)
      && d.flow.en.length !== d.flow.fa.length) {
    bad('flow', 'en and fa must have the same number of words');
  }

  return errs;
}

/* ── page shell ──────────────────────────────────────────────────────────── */

/* Identical for every book: only the <title> and the DATA object differ.
   Keep this in sync with the pages in the repo — it is the single source of
   truth for the shell, and re-running this tool rewrites pages to match. */
const page = (title, json) => `<!DOCTYPE html>
<!-- Generated page. Edit CONTENT in the DATA object below; shared UI lives in ../assets/book.css + ../assets/book.js -->
<html lang="en" dir="ltr" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — نقشهٔ دانش و یادگیری ۵ مرحله‌ای</title>

<!-- Boot theme + language BEFORE paint to avoid a flash (shared library-wide keys) -->
<script>
(function(){
  try{
    var th = localStorage.getItem('pbl-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
    document.documentElement.setAttribute('data-theme', th);
  }catch(e){ document.documentElement.setAttribute('data-theme','light'); }
  try{
    var lg = localStorage.getItem('pbl-lang') || 'en';
    document.documentElement.setAttribute('data-lang', lg);
    document.documentElement.setAttribute('lang', lg);
    document.documentElement.setAttribute('dir', lg==='fa' ? 'rtl' : 'ltr');
  }catch(e){}
})();
</script>

<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,200..700;1,6..72,200..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/book.css">
</head>
<body>
<div id="app"></div>

<script src="../assets/library.js"></script>
<script src="../assets/book.js"></script>
<script>
/* ── CONTENT — everything unique to this book lives here ── */
Book.mount(${json});
</script>
</body>
</html>
`;

/* ── run ─────────────────────────────────────────────────────────────────── */
const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node tools/build-page.js <data.json> [...]');
  process.exit(2);
}

let failed = 0;
for (const f of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { console.error(`✗ ${f}: not valid JSON — ${e.message}`); failed++; continue; }

  const errs = validate(data);
  if (errs.length) {
    console.error(`✗ ${f}: ${errs.length} problem(s)`);
    errs.forEach(e => console.error(`    ${e}`));
    failed++;
    continue;
  }

  /* DATA is embedded inside a <script> block, so a literal "</script>" or a
     lone "<!--" anywhere in the content would close it early. */
  const json = JSON.stringify(data, null, 2);
  const safe = json.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

  const dir = path.join(ROOT, data.meta.folder);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, data.meta.slug + '.html');
  fs.writeFileSync(out, page(data.meta.book.en, safe), 'utf8');
  console.log(`✓ ${data.meta.folder}/${data.meta.slug}.html  (${Math.round(safe.length / 1024)}KB DATA)`);
}

if (failed) { console.error(`\n${failed} file(s) not written.`); process.exit(1); }
