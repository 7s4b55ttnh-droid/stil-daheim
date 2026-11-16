// Prüft die Seiten „Welche Wandfarbe passt?“: node tests/wandfarben-test.js [Basis-URL]
const {chromium}=require('playwright');const B=process.argv[2]||'http://localhost:8766';let bad=0;
const ok=(c,t)=>{console.log((c?'ok   ':'FEHLER ')+t);if(!c)bad++};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780}});
await p.goto(B+'/wandfarben.html',{waitUntil:'networkidle'});
const n=await p.locator('#wf-hub a').count();ok(n>=20,'Übersicht zeigt '+n+' Kombinationen');
await p.click('#wf-fl button[data-f="sofa"]');const v=await p.locator('#wf-hub a:visible').count();ok(v>0&&v<n,'Filter Sofa zeigt '+v);
const hrefs=await p.$$eval('#wf-hub a',a=>a.map(x=>x.getAttribute('href')));
for(const h of hrefs){await p.goto(B+'/'+h,{waitUntil:'load'});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{const R=document.getElementById('wf-room'),c=document.querySelectorAll('#wf-ch button');const a=R.style.getPropertyValue('--w');c[1].click();await new Promise(z=>setTimeout(z,1100));const b2=R.style.getPropertyValue('--w');c[c.length-1].click();const im=R.querySelector('img');
  return {n:c.length,ch:a!==b2,say:document.getElementById('wf-say').textContent.length>30,cards:document.querySelectorAll('.wf-card').length,faq:document.querySelectorAll('#fragen details').length,more:document.querySelectorAll('.wf-more a').length,foto:!!(im&&im.naturalWidth>1000),ki:!!R.querySelector('.ki-marke'),kurz:!!document.getElementById('kurz-gesagt'),ld:[...document.querySelectorAll('script[type="application/ld+json"]')].some(s=>s.textContent.includes('FAQPage'))}});
 ok(r.n===5&&r.ch&&r.say&&r.cards===4&&r.faq>=2&&r.more===3&&r.kurz&&r.ld&&r.foto&&r.ki,h+' '+JSON.stringify(r))}
await b.close();console.log(bad?bad+' FEHLER':'ALLE TESTS BESTANDEN');process.exit(bad?1:0)})();
