#!/usr/bin/env node
/* ============================================================================
   tools/migrate.js — one-shot CMS migration for The Product Builder's Library
   ----------------------------------------------------------------------------
   For every book page (NN - Group/slug.html) it:
     1. reads the legacy self-contained page,
     2. lifts the inline DATA object (already valid JSON) + the four per-book
        deltas that used to be hard-coded (method text, flow words, graph
        constants) + all hero/meta strings,
     3. re-emits a thin shell page that loads the shared runtime
        (../assets/book.css + ../assets/book.js) and inlines only DATA,
     4. collects a manifest → writes assets/library.js.

   Content is preserved losslessly; the shared CSS/JS carry all presentation.

   Usage:
     node tools/migrate.js --check   # parse + validate, write nothing
     node tools/migrate.js --write   # parse + validate + rewrite pages + manifest
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

/* ── helpers ───────────────────────────────────────────────────────────────── */
function must(cond, file, field) {
  if (!cond) throw new Error(`[${file}] could not extract: ${field}`);
}
function one(html, re, file, field) {
  const m = html.match(re);
  must(m, file, field);
  return m;
}
function trim1(s) { return String(s).replace(/^\s+|\s+$/g, ''); }

/* pull every match of a global regex, returning the capture-group arrays */
function all(html, re) {
  const out = []; let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(html)) !== null) out.push(m);
  return out;
}

/* ── discover book files ───────────────────────────────────────────────────── */
const groupDirs = fs.readdirSync(ROOT)
  .filter(d => /^\d\d - /.test(d) && fs.statSync(path.join(ROOT, d)).isDirectory())
  .sort();

const books = [];
groupDirs.forEach(dir => {
  fs.readdirSync(path.join(ROOT, dir))
    .filter(f => f.endsWith('.html'))
    .sort()
    .forEach(f => books.push({ folder: dir, file: f, slug: f.replace(/\.html$/, '') }));
});

console.log(`Found ${books.length} book pages across ${groupDirs.length} groups.\n`);

/* ── per-book extraction ───────────────────────────────────────────────────── */
function extract(b) {
  const abs = path.join(ROOT, b.folder, b.file);
  const html = fs.readFileSync(abs, 'utf8');
  const F = `${b.folder}/${b.file}`;

  /* DATA object (pure JSON) */
  const dm = one(html, /var DATA = (\{[\s\S]*?\});\s*<\/script>/, F, 'DATA object');
  let data;
  try { data = JSON.parse(dm[1]); }
  catch (e) { throw new Error(`[${F}] DATA is not valid JSON: ${e.message}`); }

  /* <title> */
  const title = one(html, /<title>([\s\S]*?)<\/title>/, F, '<title>')[1];

  /* method (source & notes) — fa lives inside faText("…"), en is the plain string */
  const mm = one(html, /mth\.innerHTML = LANG==='fa' \? faText\("([\s\S]*?)"\) : "([\s\S]*?)";/, F, 'method text');
  const method = { en: mm[2], fa: mm[1] };

  /* flow words */
  const fm = one(html, /var loop = LANG==='fa' \? (\[[\s\S]*?\]) : (\[[\s\S]*?\]);/, F, 'flow words');
  const flow = { en: JSON.parse(fm[2]), fa: JSON.parse(fm[1]) };

  /* graph constants */
  const g1 = one(html, /var svg, W=(\d+), H=(\d+),/, F, 'graph W/H');
  const g2 = one(html, /R1=(\d+), R2=(\d+), span=([\d.]+)\*Math\.PI/, F, 'graph R1/R2/span');
  const graph = { W: +g1[1], H: +g1[2], R1: +g2[1], R2: +g2[2], span: +g2[3] };

  /* ── hero / meta strings ── */
  const eyeEn = one(html, /Book knowledge map · ([\s\S]*?)<\/span>/, F, 'eyebrow author (en)')[1];
  const eyeFa = one(html, /نقشهٔ کتاب · ([\s\S]*?)<\/span>/, F, 'eyebrow author (fa)')[1];

  const h1 = one(html, /<h1>\s*<span data-only="en">([\s\S]*?)<\/span>\s*<span data-only="fa">([\s\S]*?)<\/span>\s*<\/h1>/, F, 'hero title');
  const dek = one(html, /<p class="dek">\s*<span data-only="en">([\s\S]*?)<\/span>\s*<span data-only="fa">([\s\S]*?)<\/span>\s*<\/p>/, F, 'hero dek');

  const mv = all(html, /<span class="mv" data-only="en">([\s\S]*?)<\/span><span class="mv" data-only="fa">([\s\S]*?)<\/span>/);
  must(mv.length >= 4, F, `metastrip (found ${mv.length}, need 4)`);
  const book = { en: mv[0][1], fa: mv[0][2] };
  const author = { en: mv[1][1], fa: mv[1][2] };
  const published = { en: mv[2][1], fa: mv[2][2] };
  const group = { en: mv[3][1], fa: mv[3][2] };

  const chipsM = all(html, /<div class="chip"><b data-only="en">([\s\S]*?)<\/b><b data-only="fa">([\s\S]*?)<\/b><span data-only="en">([\s\S]*?)<\/span><span data-only="fa">([\s\S]*?)<\/span><\/div>/);
  must(chipsM.length === 3, F, `hero chips (found ${chipsM.length}, need 3)`);
  const chips = chipsM.map(c => ({ v: { en: c[1], fa: c[2] }, l: { en: c[3], fa: c[4] } }));

  const kM = all(html, /<div class="kbox"><div class="v" data-only="en">([\s\S]*?)<\/div><div class="v" data-only="fa">([\s\S]*?)<\/div><div class="l" data-only="en">([\s\S]*?)<\/div><div class="l" data-only="fa">([\s\S]*?)<\/div><\/div>/);
  must(kM.length === 4, F, `tldr kboxes (found ${kM.length}, need 4)`);
  const kboxes = kM.map(k => ({ v: { en: k[1], fa: k[2] }, l: { en: k[3], fa: k[4] } }));

  /* both callouts carry a per-book label + body (labels vary: "core idea" / "flow" / "cascade" …) */
  const cc = one(html, /<div class="callout accent">\s*<b data-only="en">([\s\S]*?)<\/b>\s*<b data-only="fa">([\s\S]*?)<\/b>\s*<span data-only="en">([\s\S]*?)<\/span>\s*<span data-only="fa">([\s\S]*?)<\/span>/, F, 'core callout');
  const core_callout = { label: { en: trim1(cc[1]), fa: trim1(cc[2]) }, en: trim1(cc[3]), fa: trim1(cc[4]) };

  const fc = one(html, /<div class="callout" style="margin-top:16px">\s*<b data-only="en">([\s\S]*?)<\/b><b data-only="fa">([\s\S]*?)<\/b>\s*<span data-only="en">([\s\S]*?)<\/span>\s*<span data-only="fa">([\s\S]*?)<\/span>/, F, 'flow callout');
  const flow_callout = { label: { en: trim1(fc[1]), fa: trim1(fc[2]) }, en: trim1(fc[3]), fa: trim1(fc[4]) };

  /* the eyebrow author is often an intentionally shortened form — keep it verbatim */
  const eyebrow_author = { en: trim1(eyeEn), fa: trim1(eyeFa) };

  const groupNum = parseInt(b.folder, 10);
  const meta = {
    slug: b.slug, folder: b.folder, groupNum,
    group, author, eyebrow_author, book,
    hero_title: { en: h1[1], fa: h1[2] },
    dek: { en: dek[1], fa: dek[2] },
    published,
    chips, kboxes, core_callout, flow_callout
  };

  return { title, meta, method, flow, graph, data };
}

/* ── emit a thin shell page ────────────────────────────────────────────────── */
function pageHtml(title, dataObj) {
  const json = JSON.stringify(dataObj, null, 2);
  if (/<\/script/i.test(json)) throw new Error(`DATA contains </script — cannot inline safely for ${title}`);
  return `<!DOCTYPE html>
<!-- Generated page. Edit CONTENT in the DATA object below; shared UI lives in ../assets/book.css + ../assets/book.js -->
<html lang="fa" dir="rtl" data-lang="fa">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>

<!-- Boot theme + language BEFORE paint to avoid a flash (shared library-wide keys) -->
<script>
(function(){
  try{
    var th = localStorage.getItem('pbl-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
    document.documentElement.setAttribute('data-theme', th);
  }catch(e){ document.documentElement.setAttribute('data-theme','light'); }
  try{
    var lg = localStorage.getItem('pbl-lang') || 'fa';
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,opsz@0,6..72;1,6..72&display=swap" rel="stylesheet">
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
}

/* ── run ───────────────────────────────────────────────────────────────────── */
const manifest = [];
let ok = 0;

books.forEach(b => {
  const ex = extract(b);
  manifest.push({
    slug: b.slug, folder: b.folder, groupNum: ex.meta.groupNum,
    group: ex.meta.group, book: ex.meta.book
  });

  /* assemble the new DATA: meta + the three lifted deltas + original content */
  const out = { meta: ex.meta, method: ex.method, flow: ex.flow, graph: ex.graph };
  Object.keys(ex.data).forEach(k => { out[k] = ex.data[k]; });

  const html = pageHtml(ex.title, out);
  if (WRITE) fs.writeFileSync(path.join(ROOT, b.folder, b.file), html, 'utf8');
  ok++;
  console.log(`  ✓ ${b.folder}/${b.file}  (parts:${ex.data.parts.length} chapters:${Object.keys(ex.data.chapters).length} stages:${ex.data.stages.length})`);
});

/* manifest → assets/library.js */
manifest.sort((a, b) => a.groupNum - b.groupNum || a.slug.localeCompare(b.slug));
const libjs = `/* ============================================================================
   library.js — manifest of all ${manifest.length} books (generated by tools/migrate.js)
   Drives the library navigation header: prev/next + the "all books" overlay.
   ========================================================================== */
window.LIBRARY = ${JSON.stringify(manifest, null, 2)};
`;
if (WRITE) fs.writeFileSync(path.join(ROOT, 'assets', 'library.js'), libjs, 'utf8');

console.log(`\n${ok}/${books.length} pages processed. ${WRITE ? 'WROTE pages + assets/library.js.' : 'CHECK only — nothing written.'}`);
