#!/usr/bin/env node
/* ============================================================================
   tools/verify.js — lossless-migration proof
   ----------------------------------------------------------------------------
   For every book page it compares the migrated file (on disk) against the
   ORIGINAL committed at git HEAD, and asserts:

     1. migrated DATA, minus the four added keys (meta/method/flow/graph),
        DEEP-EQUALS the original inline DATA object  → no content lost/altered;
     2. DATA.method / DATA.flow / DATA.graph equal the values that used to be
        hard-coded in the original page's JavaScript;
     3. the migrated page references the shared assets and calls Book.mount.

   Exit code 0 = all 45 pass. Non-zero = a mismatch (printed).
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

/* originals live at git HEAD (this branch's first commit) */
function gitHead(rel) {
  return execSync(`git show HEAD:"${rel}"`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
}

function deepEqual(a, b, pathStr = '$') {
  if (a === b) return null;
  if (typeof a !== typeof b) return `${pathStr}: type ${typeof a} ≠ ${typeof b}`;
  if (a && b && typeof a === 'object') {
    const ak = Array.isArray(a) ? a.map((_, i) => i) : Object.keys(a);
    const bk = Array.isArray(b) ? b.map((_, i) => i) : Object.keys(b);
    if (ak.length !== bk.length) return `${pathStr}: length ${ak.length} ≠ ${bk.length} (keys ${ak.join(',')} | ${bk.join(',')})`;
    for (const k of ak) {
      const r = deepEqual(a[k], b[k], `${pathStr}.${k}`);
      if (r) return r;
    }
    return null;
  }
  return `${pathStr}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`;
}

/* discover books from the working tree (numbered group folders) */
const books = [];
fs.readdirSync(ROOT)
  .filter(d => /^\d\d - /.test(d) && fs.statSync(path.join(ROOT, d)).isDirectory())
  .sort()
  .forEach(dir => fs.readdirSync(path.join(ROOT, dir))
    .filter(f => f.endsWith('.html')).sort()
    .forEach(f => books.push({ rel: `${dir}/${f}`, abs: path.join(ROOT, dir, f) })));

let pass = 0; const fails = [];

books.forEach(b => {
  const orig = gitHead(b.rel);
  const migr = fs.readFileSync(b.abs, 'utf8');

  /* original inline DATA */
  const od = orig.match(/var DATA = (\{[\s\S]*?\});\s*<\/script>/);
  if (!od) { fails.push(`${b.rel}: original DATA not found`); return; }
  const origData = JSON.parse(od[1]);

  /* migrated DATA (argument to Book.mount) */
  const md = migr.match(/Book\.mount\((\{[\s\S]*\})\);\s*<\/script>/);
  if (!md) { fails.push(`${b.rel}: migrated Book.mount(DATA) not found`); return; }
  const newData = JSON.parse(md[1]);

  /* (1) content parity: strip the four added keys, compare the rest */
  const stripped = Object.assign({}, newData);
  delete stripped.meta; delete stripped.method; delete stripped.flow; delete stripped.graph;
  const dRes = deepEqual(origData, stripped);
  if (dRes) { fails.push(`${b.rel}: DATA content drift — ${dRes}`); return; }

  /* (2) method/flow/graph match the original hard-coded JS */
  const mm = orig.match(/mth\.innerHTML = LANG==='fa' \? faText\("([\s\S]*?)"\) : "([\s\S]*?)";/);
  if (!mm || newData.method.en !== mm[2] || newData.method.fa !== mm[1]) { fails.push(`${b.rel}: method text drift`); return; }

  const fm = orig.match(/var loop = LANG==='fa' \? (\[[\s\S]*?\]) : (\[[\s\S]*?\]);/);
  const flowRes = deepEqual({ en: JSON.parse(fm[2]), fa: JSON.parse(fm[1]) }, newData.flow);
  if (flowRes) { fails.push(`${b.rel}: flow drift — ${flowRes}`); return; }

  const g1 = orig.match(/var svg, W=(\d+), H=(\d+),/);
  const g2 = orig.match(/R1=(\d+), R2=(\d+), span=([\d.]+)\*Math\.PI/);
  const gExp = { W: +g1[1], H: +g1[2], R1: +g2[1], R2: +g2[2], span: +g2[3] };
  const gRes = deepEqual(gExp, newData.graph);
  if (gRes) { fails.push(`${b.rel}: graph const drift — ${gRes}`); return; }

  /* (3) shell wiring present */
  if (!/\.\.\/assets\/book\.css/.test(migr) || !/\.\.\/assets\/book\.js/.test(migr) || !/\.\.\/assets\/library\.js/.test(migr)) {
    fails.push(`${b.rel}: missing asset references`); return;
  }
  /* (4) meta essentials present */
  const m = newData.meta;
  if (!m || !m.slug || !m.hero_title || !m.author || !m.book || !m.core_callout || !m.flow_callout) {
    fails.push(`${b.rel}: incomplete meta`); return;
  }

  pass++;
});

console.log(`Lossless-parity verification: ${pass}/${books.length} pages passed.`);
if (fails.length) { console.error('\nFAILURES:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('✓ Every migrated page preserves its original DATA exactly, plus the migrated method/flow/graph constants match the originals.');
