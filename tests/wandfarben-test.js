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
// Zusatzfunktionen: Abendlicht, Vergleich, Sitz und Boden, eigenes Foto
await p.goto(B+'/wandfarbe-nordzimmer.html',{waitUntil:'load'});await p.waitForTimeout(400);
await p.click('#wf-eveb');ok(await p.evaluate(()=>document.getElementById('wf-room').classList.contains('eve')),'Abendlicht schaltet');
await p.click('#wf-cmpb');ok(await p.evaluate(()=>!document.querySelector('.wf-cut').hidden&&!document.getElementById('wf-r2').hidden),'Vergleich zeigt Regler und rechte Farbe');
const zz=await p.evaluate(()=>{const o={};document.querySelectorAll('.wf-ch2').forEach(g=>{g.querySelectorAll('button')[2].click();o[g.dataset.was]=document.querySelector('.wf-k.wf-'+g.dataset.was).style.background});return o});
ok(!!zz.sitz&&!!zz.boden&&zz.sitz!=='transparent'&&zz.boden!=='transparent','Sofa und Boden lassen sich umfärben '+JSON.stringify(zz));
const mk=await p.evaluate(async()=>{const a=[];for(const w of ['maske','sitz','boden']){const r=await fetch('assets/wf-nordzimmer-'+w+'.png');a.push(r.status)}return a});ok(mk.every(x=>x===200),'Masken laden '+mk);
// Das Wandfarben-Studio (wandfarbe-testen.html und Startseite) prüft tests/studio-test.js
await b.close();console.log(bad?bad+' FEHLER':'ALLE TESTS BESTANDEN');process.exit(bad?1:0)})();
