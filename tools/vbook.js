const { chromium } = require('playwright');
const file = 'file://' + process.argv[2];
const shot = process.argv[3];
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1280,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(file,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(900);
  const nodes=await p.$$eval('#netsvg .node',e=>e.length);
  const links=await p.$$eval('#netsvg .glink',e=>e.length);
  const cov=await p.evaluate(()=>({parts:DATA.parts.length,leaves:Object.keys(DATA.chapters).length,
     chMore:Object.values(DATA.chapters).filter(c=>c.more).length, stages:DATA.stages.length,
     quotes:DATA.quotes.length, media:DATA.media.length, tldr:DATA.tldr.length}));
  // grow on select
  const firstLeaf = await p.$eval('#netsvg .node[data-id^="c_"]', e=>e.getAttribute('data-id'));
  const w0=await p.$eval('#netsvg .node[data-id="'+firstLeaf+'"] circle',c=>c.getBoundingClientRect().width);
  await p.click('#netsvg .node[data-id="'+firstLeaf+'"]'); await p.waitForTimeout(350);
  const w1=await p.$eval('#netsvg .node[data-id="'+firstLeaf+'"] circle',c=>c.getBoundingClientRect().width);
  const rows=await p.$$eval('#detailHost .dlab',els=>els.map(x=>x.textContent.replace(/[‏⁦⁩]/g,'')));
  // fa leak
  await p.evaluate(()=>document.getElementById('netsvg').dispatchEvent(new MouseEvent('click',{bubbles:true})));
  const leak=await p.evaluate(()=>{const o=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){const t=n.nodeValue;if(!/[0-9]/.test(t))continue;const el=n.parentElement;
    if(!el||el.closest('script,style'))continue;if(el.offsetParent===null)continue;if(getComputedStyle(el).display==='none')continue;o.push(t.trim().slice(0,20));}return o;});
  if(shot){ await p.$('#netView').then(e=>e.screenshot({path:shot})); }
  console.log(JSON.stringify({errs,nodes,links,cov,grow:+(w1/w0).toFixed(2),rows,leak},null,2));
  await b.close();
})();
