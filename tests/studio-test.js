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
const sh=await p.evaluate(()=>{const e=document.querySelector('.st-shop');return {h:e.hidden,l:[...e.querySelectorAll('a')].map(a=>[a.textContent,a.href,a.rel]),tag:!!e.querySelector('.tag')}});ok(!sh.h&&sh.l.length===3&&/Sofas in Beige/.test(sh.l[0][0])&&/OTTO/.test(sh.l[1][0])&&sh.l.every(x=>(/amazon\.de\/s\?k=.+&tag=stildaheim-21$/.test(x[1])||/awin1\.com\/cread\.php\?awinmid=14336&awinaffid=3156925&ued=https%3A%2F%2Fwww\.otto\.de/.test(x[1]))&&/sponsored/.test(x[2]))&&sh.tag,'Nach dem Umfärben: gekennzeichnete Links zu Sofa und Boden '+JSON.stringify(sh.l.map(x=>x[0])));
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
await p.locator('.st-dots button[title="Petrol"]').first().click();await p.waitForTimeout(300);const p2=await p.evaluate(()=>{const c=document.querySelector('.st-ph canvas'),w=c.getContext('2d').getImageData(Math.round(c.width*.5),Math.round(c.height*.15),1,1).data;return [...w].slice(0,3)});ok(p2[2]>p2[0]+20,'Farbwechsel im eigenen Foto wirkt '+JSON.stringify(p2));
// Eigene Farbe mischen (eigene Seite, damit der Rest unberührt bleibt)
{const q=await ctx.newPage();const qe=[];q.on('pageerror',e=>qe.push(e.message));await q.goto(B+'/wandfarbe-testen.html?raum=graues-sofa&farbe=A9B8A0',{waitUntil:'networkidle'});await q.waitForTimeout(400);
const Z=()=>q.evaluate(()=>{const e=document.querySelector('.st');return {f:e.STUDIO.farbe(),w:e.querySelector('.st-ph').style.getPropertyValue('--w'),cap:e.querySelector('.st-cap').textContent,d0:e.querySelector('.st-dots button').dataset.c,mix:!e.querySelector('.st-mix').hidden,ral:e.querySelector('.st-kauf').textContent.slice(0,400)}});
await q.locator('.st-misch>summary').click();const z0=await Z();
await q.locator('.st-nudge [data-n="h"]').click();await q.waitForTimeout(200);const z1=await Z();
ok(z1.f[1]!==z0.f[1]&&z1.w===z1.f[1]&&/Deine Mischung/.test(z1.cap)&&/selbst gemischt/.test(z1.cap)&&z1.d0===z1.f[1],'„Heller“ macht eine eigene Farbe, die Wand zeigt sie '+JSON.stringify([z0.f,z1.f]));
const lum=h=>parseInt(h.slice(1,3),16)+parseInt(h.slice(3,5),16)+parseInt(h.slice(5,7),16);ok(lum(z1.f[1])>lum(z0.f[1]),'Die Farbe ist wirklich heller');
await q.locator('.st-nudge [data-n="w"]').click();await q.waitForTimeout(150);const zw=await Z();ok(parseInt(zw.f[1].slice(1,3),16)>parseInt(z1.f[1].slice(1,3),16)&&parseInt(zw.f[1].slice(5,7),16)<parseInt(z1.f[1].slice(5,7),16),'„Wärmer“ schiebt Richtung Rot, weg von Blau');
const mb=q.locator('.st-mdots button').nth(3);const bc=await mb.getAttribute('data-c');await mb.click();await q.waitForTimeout(200);const z2=await Z();
ok(z2.mix&&z2.f[1]!==zw.f[1]&&z2.f[1]!==bc.toUpperCase(),'Zweite Farbe gewählt: Mischung halb und halb, Regler erscheint');
await q.locator('.st-mix input').evaluate(e=>{e.value=100;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))});await q.waitForTimeout(250);const z3=await Z();
ok(z3.f[1]===bc.toUpperCase(),'Regler ganz rechts ergibt genau die zweite Farbe '+z3.f[1]);
await q.locator('.st-hsl>summary').click();await q.locator('.st-hsl input').nth(0).evaluate(e=>{e.value=210;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))});await q.waitForTimeout(250);const z4=await Z();
ok(parseInt(z4.f[1].slice(5,7),16)>=parseInt(z4.f[1].slice(1,3),16),'Farbton-Regler auf Blau: Blauanteil mindestens so hoch wie Rot '+z4.f[1]);
// Farbe aus Foto: einfarbiges Testbild, Tipp in die Mitte ergibt (fast) genau diese Farbe
const png=await q.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=120;const g=c.getContext('2d');g.fillStyle='#B4553C';g.fillRect(0,0,200,120);return c.toDataURL('image/png').split(',')[1]});
await q.locator('.st-pip input').setInputFiles({name:'kissen.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await q.waitForTimeout(500);ok(await q.locator('.st-pipc').isVisible(),'Foto zum Aufnehmen wird gezeigt');
const pb=await q.locator('.st-pipc').boundingBox();await q.locator('.st-pipc').click({position:{x:pb.width/2,y:pb.height/2}});await q.waitForTimeout(250);const z5=await Z();
const nah=(a,b)=>[1,3,5].every(i=>Math.abs(parseInt(a.slice(i,i+2),16)-parseInt(b.slice(i,i+2),16))<=3);ok(nah(z5.f[1],'#B4553C')&&/Aus deinem Foto/.test(z5.cap)&&z5.w===z5.f[1],'Tipp ins Foto nimmt die Farbe auf '+z5.f[1]);
await q.locator('.st-kauf>summary').click();ok(/RAL \d{4}/.test((await Z()).ral),'Eigene Farbe bekommt den nächsten RAL-Ton');
await q.reload({waitUntil:'networkidle'});await q.waitForTimeout(400);const z6=await q.evaluate(()=>[...document.querySelectorAll('.st-dots button[data-t="eigen"]')].length);ok(z6>=3&&z6<=5,'Eigene Farben bleiben nach dem Neuladen ('+z6+')');
ok(!qe.length,'Mischen ohne Skriptfehler '+JSON.stringify(qe));await q.locator('.st-misch>summary').click();await q.locator('.st-nudge [data-n="k"]').click();await q.locator('.st').screenshot({path:'/tmp/claude-0/-home-claude/9e0351cc-45dc-5c59-bff1-529ce2c8a069/scratchpad/awin/misch.png'}).catch(()=>{});await q.close()}
// Eigenes Foto: Sofa umfärben (Farbe wählen, Sofa antippen), Wand bleibt, „Original“ nimmt die Farbe zurück
const pxl=(x,y)=>p.evaluate(([x,y])=>{const c=document.querySelector('.st-ph canvas');return [...c.getContext('2d').getImageData(Math.round(c.width*x),Math.round(c.height*y),1,1).data].slice(0,3)},[x,y]);
const sv=await pxl(.5,.55),wv=await pxl(.5,.15);await p.locator('.st-grp[data-was="sitz"] button[title="Blau"]').click();ok(/Sofa/.test(await p.textContent('.st-msg'))&&await p.locator('[data-z="sitz"]').getAttribute('aria-pressed')==='true','Sofafarbe gewählt: Studio bittet um einen Tipp aufs Sofa');
const cb=await p.locator('.st-ph canvas').boundingBox();await p.locator('.st-ph canvas').click({position:{x:cb.width*.5,y:cb.height*.55}});await p.waitForTimeout(500);const sn=await pxl(.5,.55),wn=await pxl(.5,.15);
ok(sv[0]>sv[2]+30&&sn[2]>sn[0]+30,'Sofa im eigenen Foto ist jetzt blau '+JSON.stringify([sv,sn]));ok(Math.abs(wv[0]-wn[0])<4&&Math.abs(wv[2]-wn[2])<4,'Die Wand bleibt dabei unverändert');
ok(/Sofas in Blau ansehen/.test(await p.textContent('.st-shop'))&&/Anzeige/.test(await p.textContent('.st-shop')),'Kauflink zum Sofa, als Anzeige gekennzeichnet');
await p.locator('.st-grp[data-was="sitz"] button[title="Original"]').click();await p.waitForTimeout(300);const sz=await pxl(.5,.55);ok(Math.abs(sz[0]-sv[0])<4,'„Original“ zeigt das Sofa wieder wie im Foto');
await p.locator('[data-z="wand"]').click();ok(/Wand/.test(await p.textContent('.st-msg')),'Zurück auf „Wand“ schaltbar');
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
