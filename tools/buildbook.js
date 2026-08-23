/* buildbook.js — inject a per-book config into the page engine.
   usage: node tools/buildbook.js tools/configs/<slug>.js "NN - Group/<slug>.html" */
const fs = require('fs');
const path = require('path');
const cfg = require(path.resolve(process.argv[2]));
const out = process.argv[3];
const BASE = path.join(__dirname, 'engine.html');   // the template page
let s = fs.readFileSync(BASE, 'utf8');
const J = o => JSON.stringify(o);
const errs = [];

function block(startMark, endMark, replacement, name){
  const i = s.indexOf(startMark);
  if(i<0){ errs.push('start:'+name); return; }
  const j = s.indexOf(endMark, i+startMark.length);
  if(j<0){ errs.push('end:'+name); return; }
  s = s.slice(0,i) + replacement + s.slice(j+endMark.length);
}
function upto(startMark, endMark, replacement, name){
  const i = s.indexOf(startMark);
  if(i<0){ errs.push('start:'+name); return; }
  const j = s.indexOf(endMark, i+startMark.length);
  if(j<0){ errs.push('end:'+name); return; }
  s = s.slice(0,i) + replacement + s.slice(j);
}
function exact(a, b, name){
  if(s.indexOf(a)<0){ errs.push('exact:'+(name||a.slice(0,40))); return; }
  s = s.split(a).join(b);
}

// 1) DATA object
(function(){
  const a = s.indexOf('var DATA = {');
  const b = s.indexOf('};\n</script>', a);
  if(a<0||b<0){ errs.push('DATA'); return; }
  s = s.slice(0,a) + 'var DATA = ' + J(cfg.data) + s.slice(b+1);
})();

// 2) title + brand + storage slug
exact('<title>Atomic Habits — عادت‌های اتمی · نقشهٔ دانش و یادگیری ۵ مرحله‌ای</title>',
      '<title>'+cfg.titleTag+'</title>', 'title');
exact('<span class="brand"><span class="dot"></span>Atomic Habits</span>',
      '<span class="brand"><span class="dot"></span>'+cfg.brand+'</span>', 'brand');
exact("'ah-theme'", "'"+cfg.slug+"-theme'", 'skey-theme');
exact("'ah-lang'",  "'"+cfg.slug+"-lang'",  'skey-lang');

// 3) hero
block('<header class="hero"><div class="wrap">', '</div></header>',
      '<header class="hero"><div class="wrap">\n'+cfg.hero+'\n</div></header>', 'hero');

// 4) core-idea callout
block('<div class="callout accent">', '</div>',
      '<div class="callout accent">\n'+cfg.callout+'\n  </div>', 'callout');

// 5) KPI grid
(function(){
  const kg = s.indexOf('<div class="kgrid">');
  const ca = s.indexOf('<div class="callout accent">');
  if(kg<0||ca<0){ errs.push('kpis'); return; }
  const end = s.lastIndexOf('</div>', ca);
  s = s.slice(0,kg) + '<div class="kgrid">\n'+cfg.kpis+'\n  </div>\n  ' + s.slice(end+6);
})();

// 6) map-view flow callout
block('<div class="callout" style="margin-top:16px">', '</div>',
      '<div class="callout" style="margin-top:16px">\n'+cfg.mapcallout+'\n    </div>', 'mapcallout');

// 7) method block
upto("  var mth=document.getElementById('methodHost');",
     "  var fl=document.getElementById('flowTop');",
`  var mth=document.getElementById('methodHost');
  mth.innerHTML = LANG==='fa' ? faText(${J(cfg.methodFa)}) : ${J(cfg.methodEn)};
`, 'method');

// 8) flow line words
exact("var loop = LANG==='fa' ? ['نشانه','ولع','واکنش','پاداش'] : ['Cue','Craving','Response','Reward'];",
      "var loop = LANG==='fa' ? "+J(cfg.flowFa)+" : "+J(cfg.flowEn)+";", 'flow');

// 9) leaf kicker word
exact("(LANG==='fa'?'تکنیکِ':'Technique')",
      "(LANG==='fa'?"+J(cfg.leafKickFa)+":"+J(cfg.leafKickEn)+")", 'leafkick');

// 10) canvas + layout radii
exact('var svg, W=980, H=780,', 'var svg, W='+cfg.W+', H='+cfg.H+',', 'canvas');
exact('R1=220, R2=126, span=66*Math.PI/180;',
      'R1='+cfg.R1+', R2='+cfg.R2+', span='+cfg.span+'*Math.PI/180;', 'layout');

if(errs.length){ console.error('BUILD ERRORS:', errs.join(', ')); process.exit(1); }
fs.writeFileSync(out, s);
console.log('OK →', out, '('+s.length+' bytes)');
