// Prüft das Wandfarben-Studio (studio.js) auf wandfarbe-testen.html und der Startseite: node tests/studio-test.js [Basis-URL]
const {chromium}=require('playwright');const B=process.argv[2]||'http://localhost:8766';let bad=0;
const ok=(c,t)=>{console.log((c?'ok   ':'FEHLER ')+t);if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780},reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(B+'/wandfarbe-testen.html',{waitUntil:'networkidle'});await p.waitForTimeout(500);
const S=()=>p.evaluate(()=>{const e=document.querySelector('.st'),ph=e.querySelector('.st-ph');return {raum:e.STUDIO.raum(),farbe:e.STUDIO.farbe(),art:e.STUDIO.art(),w:ph.style.getPropertyValue('--w'),img:ph.querySelector('img').naturalWidth,src:ph.querySelector('img').getAttribute('src')}});
let s=await S();ok(s.raum==='graues-sofa'&&s.img>1000&&s.w,'Studio startet mit Raum und Farbe '+JSON.stringify(s));
const nr=await p.locator('.st-rooms button').count();ok(nr>=24,nr+' Beispielräume in der Leiste');
const th=await p.evaluate(async()=>{let n=0;for(const i of document.querySelectorAll('.st-rooms img')){const r=await fetch(i.getAttribute('src'));if(r.status===200)n++}return n});ok(th===nr,'Vorschaubilder laden ('+th+')');
ok(await p.locator('.st-ki').isVisible(),'Beispielraum trägt den KI-Hinweis');
// Farbe wechseln
await p.locator('.st-dots button').nth(3).click();await p.waitForTimeout(1400);let s2=await S();ok(s2.w!==s.w&&s2.w.toUpperCase()===s2.farbe[1].toUpperCase(),'Farbpunkt ändert die Wand: '+s2.farbe[0]);
// Raum wechseln
await p.locator('.st-rooms button[data-s="gruenes-sofa"]').click();await p.waitForTimeout(900);let s3=await S();ok(s3.raum==='gruenes-sofa'&&/gruenes-sofa/.test(s3.src),'Raumwechsel lädt das neue Foto');
ok(/gruenes-sofa/.test(await p.locator('.st-link a').getAttribute('href')),'Link zur passenden Erklärseite');
// Sofa und Boden umfärben: Bildpunkt auf dem Sofa prüfen (gespeichertes Bild wird wie die Ansicht zusammengesetzt)
const bg=w=>p.evaluate(w=>[...document.querySelectorAll('.st-ph .st-'+w)].map(x=>x.style.background),w);
ok(await p.locator('.st-grp[data-was="sitz"] button').count()>=6,'Sofafarben werden angeboten');
await p.locator('.st-grp[data-was="sitz"] button[title="Beige"]').click();await p.waitForTimeout(200);const sb=await bg('sitz');ok(/rgb/.test(sb.join())&&sb[1]!=='rgb(0, 0, 0)','Dunkles Sofa wird über screen aufgehellt '+JSON.stringify(sb));
await p.locator('.st-grp[data-was="boden"] button').nth(2).click();await p.waitForTimeout(200);const bb=await bg('boden');ok(bb[0]!=='rgb(255, 255, 255)','Boden wird über multiply abgedunkelt '+JSON.stringify(bb));
await p.locator('.st-grp[data-was="sitz"] button').first().click();const so=await bg('sitz');ok(so[2]==='transparent','Original stellt das Sofa zurück');
// Abendlicht, Überraschung, Liebling, Merken
await p.click('[data-a="abend"]');ok(await p.evaluate(()=>document.querySelector('.st-ph').classList.contains('eve')),'Abendlicht schaltet');await p.click('[data-a="abend"]');
await p.click('.st-herz');const fav=await p.evaluate(()=>JSON.parse(localStorage.getItem('sdst')));ok(fav.f.length===1&&fav.r==='gruenes-sofa'&&fav.c,'Liebling, Raum und Farbe werden im Browser gemerkt '+JSON.stringify(fav));
ok(await p.locator('.st-dots button em').count()===1,'Lieblingsfarbe steht vorn mit Herz');
await p.click('[data-a="zufall"]');await p.waitForTimeout(900);const z=await S();ok(z.raum&&z.w.toUpperCase()===z.farbe[1].toUpperCase()&&(await p.locator('.st-msg').textContent()).length>5,'Überrasch mich wählt Raum und Farbe: '+z.raum+', '+z.farbe[0]);
await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(500);const m=await S();ok(m.raum===z.raum&&m.farbe[1]===z.farbe[1],'Nach dem Neuladen ist der letzte Stand wieder da');
// Bild speichern (Download)
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.click('[data-a="speichern"]')]);const fs=require('fs'),pf=await dl.path();ok(fs.statSync(pf).size>40000&&/^wandfarbe-/.test(dl.suggestedFilename()),'Bild speichern liefert '+dl.suggestedFilename()+' ('+Math.round(fs.statSync(pf).size/1024)+' KB)');
// Eigenes Foto: als Datei ein Beispielraum-Foto, die Wand muss von selbst erkannt werden
const buf=await p.evaluate(async()=>{const r=await fetch('assets/wf-braunes-ledersofa.jpg');return [...new Uint8Array(await r.arrayBuffer())]});
await p.locator('.st-dots button[title="Salbeigrün"]').first().click();
await p.locator('.st-rooms input[type=file]').setInputFiles({name:'zimmer.jpg',mimeType:'image/jpeg',buffer:Buffer.from(buf)});await p.waitForTimeout(1800);
const f=await p.evaluate(()=>{const e=document.querySelector('.st'),F=e.STUDIO.foto,c=e.querySelector('canvas'),x=c.getContext('2d');let n=0;for(let i=0;i<F.mask.length;i++)n+=F.mask[i];const w=x.getImageData(Math.round(c.width*.5),Math.round(c.height*.15),1,1).data,so=x.getImageData(Math.round(c.width*.5),Math.round(c.height*.52),1,1).data;
 return {art:e.STUDIO.art(),an:n/F.mask.length,w:[...w].slice(0,3),so:[...so].slice(0,3),ki:getComputedStyle(e.querySelector('.st-ki')).display,fein:!e.querySelector('.st-fein').hidden,msg:e.querySelector('.st-msg').textContent}});
ok(f.art==='foto'&&f.an>.3&&f.an<.65,'Eigenes Foto: Wand von selbst erkannt ('+Math.round(f.an*100)+' %)');
ok(f.w[1]>f.w[0]+8&&f.so[0]>f.so[1]+30,'Wand ist grün, das Ledersofa bleibt braun '+JSON.stringify([f.w,f.so]));
ok(f.ki==='none'&&f.fein&&/Wand/.test(f.msg),'Eigenes Foto ohne KI-Hinweis, mit „Feiner einstellen“ und Hinweistext');
await p.locator('.st-dots button[title="Petrol"]').first().click();await p.waitForTimeout(300);const p2=await p.evaluate(()=>{const c=document.querySelector('.st canvas'),w=c.getContext('2d').getImageData(Math.round(c.width*.5),Math.round(c.height*.15),1,1).data;return [...w].slice(0,3)});ok(p2[2]>p2[0]+20,'Farbwechsel im eigenen Foto wirkt '+JSON.stringify(p2));
await p.locator('.st-rooms button').nth(1).click();await p.waitForTimeout(700);const zr=await S();ok(zr.art==='raum'&&await p.locator('.st-ki').isVisible(),'Zurück zum Beispielraum');
// Halbhoch, Teilen-Link, Kaufen
await p.goto(B+'/wandfarbe-testen.html?raum=gruenes-sofa',{waitUntil:'networkidle'});await p.waitForTimeout(500);
await p.click('[data-a="halb"]');ok(await p.evaluate(()=>{const ph=document.querySelector('.st-ph');return ph.classList.contains('halb')&&/inset\(4\d%/.test(getComputedStyle(ph.querySelector('.st-lay')).clipPath)}),'Halbhoch: Farbe nur auf der unteren Wandhälfte');
await p.locator('.st-grp[data-was="sitz"] button[title="Blau"]').click();await p.locator('.st-dots button[title="Altrosa"]').first().click();await p.waitForTimeout(1300);
const adr=await p.evaluate(()=>document.querySelector('.st').STUDIO.adresse());ok(/raum=gruenes-sofa&farbe=D4B2A7&sofa=3E5C7E&halb=1$/.test(adr),'Teilen-Link enthält Raum, Farbe, Sofa, halbhoch: '+adr.split('?')[1]);
await p.evaluate(()=>localStorage.removeItem('sdst'));await p.goto(B+'/wandfarbe-testen.html?'+adr.split('?')[1],{waitUntil:'networkidle'});await p.waitForTimeout(900);
const g=await p.evaluate(()=>{const e=document.querySelector('.st'),ph=e.querySelector('.st-ph');return {r:e.STUDIO.raum(),f:e.STUDIO.farbe()[1],k:ph.querySelector('.st-k.st-sitz').style.background,h:ph.classList.contains('halb'),pr:e.querySelector('.st-grp[data-was="sitz"] button[title="Blau"]').getAttribute('aria-pressed')}});
ok(g.r==='gruenes-sofa'&&g.f==='#D4B2A7'&&/62, 92, 126/.test(g.k)&&g.h&&g.pr==='true','Geteilter Link stellt alles wieder her '+JSON.stringify(g));
await p.click('.st-kauf summary');const kf=await p.evaluate(()=>{const k=document.querySelector('.st-kauf');return {ral:k.querySelector('.st-ral').textContent,l:k.querySelector('.st-lit b').textContent,links:[...k.querySelectorAll('.starts a')].map(a=>a.href),rel:k.querySelector('.starts a').rel,tag:!!k.querySelector('.tag')}});
ok(/RAL \d{4}/.test(kf.ral)&&/Liter/.test(kf.l)&&kf.links.length===5&&kf.links.every(h=>/amazon\.de\/s\?k=.+&tag=stildaheim-21$/.test(h))&&/sponsored/.test(kf.rel)&&kf.tag,'Kaufen: RAL-Ton, Liter, 5 gekennzeichnete Partnerlinks '+kf.ral.replace(/\s+/g,' ')+' | '+kf.l);
ok(await p.evaluate(()=>{const S=document.querySelector('.st').STUDIO;return S.ral('#F7F9EF').nr===9010&&S.ral('#26392F').nr===6009}),'RAL-Suche findet exakte Töne');
await p.goto(B+'/wandfarbe-testen.html?mix=8f5530-Cognac,c49a3a-Senfgelb,1f5560-Petrol',{waitUntil:'networkidle'});await p.waitForTimeout(600);const mx=await p.evaluate(()=>{const e=document.querySelector('.st');return {f:e.STUDIO.farbe(),n:e.querySelectorAll('.st-dots button[data-t="stil"]').length,cap:e.querySelector('.st-cap span').textContent}});
ok(mx.f[0]==='Cognac'&&mx.n===3&&/Stil/.test(mx.cap),'Stil-Finder-Link bringt die Stilfarben mit '+JSON.stringify(mx));
// Link von einer Unterseite: ?raum=
await p.goto(B+'/wandfarbe-testen.html?raum=nordzimmer',{waitUntil:'networkidle'});await p.waitForTimeout(400);ok((await S()).raum==='nordzimmer','?raum=nordzimmer öffnet diesen Raum');
// Startseite: kurze Fassung
await p.evaluate(()=>localStorage.removeItem('sdst'));await p.goto(B+'/',{waitUntil:'networkidle'});await p.waitForTimeout(500);
const h=await p.evaluate(()=>{const e=document.querySelector('#studio .st');return {da:!!e&&!!e.STUDIO,raum:e&&e.STUDIO.raum(),sicht:[...e.querySelectorAll('.st-rooms button')].filter(x=>x.offsetParent).length,datei:!!e.querySelector('input[type=file]'),links:[...e.querySelectorAll('.st-los a')].map(a=>a.getAttribute('href'))}});
ok(h.da&&h.raum==='graues-sofa'&&h.sicht===6&&!h.datei&&h.links.length===2,'Startseite: kurzes Studio mit 6 Räumen und zwei Wegen ins Studio '+JSON.stringify(h));
const w0=await p.evaluate(()=>document.querySelector('#studio .st-ph').style.getPropertyValue('--w'));await p.locator('#studio .st-dots button').nth(2).click();await p.waitForTimeout(1400);ok(await p.evaluate(()=>document.querySelector('#studio .st-ph').style.getPropertyValue('--w'))!==w0,'Startseite: Farbpunkt ändert die Wand');
ok(!errs.length,'Keine Skriptfehler '+errs.join(' | '));
await b.close();console.log(bad?bad+' FEHLER':'ALLE TESTS BESTANDEN');process.exit(bad?1:0)})();
