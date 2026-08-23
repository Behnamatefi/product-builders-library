/* patchcatalog.js — mark book(s) "live" (green) in the catalog index.html.
   Idempotent. usage: node tools/patchcatalog.js "Exact English Title|NN - Group/slug.html" ... */
const fs = require('fs');
const path = require('path');
const IDX = path.join(__dirname, '..', 'index.html');
const args = process.argv.slice(2);
let s = fs.readFileSync(IDX, 'utf8');
let added = 0; const missing = [];
for (const a of args) {
  const i = a.indexOf('|'); const title = a.slice(0, i), href = a.slice(i + 1);
  if (s.includes('href:"' + href + '"')) continue;          // already live
  const needle = '{en:{t:"' + title + '"';
  if (!s.includes(needle)) { missing.push(title); continue; }
  s = s.replace(needle, '{live:true, href:"' + href + '", en:{t:"' + title + '"');
  added++;
}
const live = (s.match(/live:true/g) || []).length;
s = s.replace(/<b id="kDone">\d+<\/b>/, '<b id="kDone">' + live + '</b>');
s = s.replace(/getElementById\('kDone'\)\.textContent = num\(\d+\)/, "getElementById('kDone').textContent = num(" + live + ")");
fs.writeFileSync(IDX, s);
console.log(JSON.stringify({ added, live, missing }));
