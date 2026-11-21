// Prüft „Wohnideen zum Stöbern“ (wohnideen.html, wohnideen.js) und auf der Startseite Schaufenster, Bilder-Duell und Bühne.
// node wohnideen-test.js [Basis-URL]      (nur Chromium; Safari und Firefox prüft dieser Test nicht)
const {chromium,devices}=require('playwright');const B=process.argv[2]||'http://localhost:8766';let bad=0;
const ok=(c,t)=>{console.log((c?'ok   ':'FEHLER ')+t);if(!c)bad++};
(async()=>{const b=await chromium.launch();const errs=[],fremd=[];
const neu=async(o)=>{const c=await b.newContext(o);const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
  p.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^data:|^blob:/.test(u)&&!/goatcounter/.test(u))fremd.push(u)});return [c,p]};
const st=p=>p.evaluate(()=>({y:document.body.scrollTop,a:sdWohnideen.aktiv(),nr:document.getElementById('ed-nr').textContent,n:+document.getElementById('ed-n').textContent,h:location.hash}));
const ruhig=async(p,ms)=>p.waitForTimeout(ms||1300);

/* ---------- Feed am PC ---------- */
let [c,p]=await neu({viewport:{width:1440,height:900}});
await p.goto(B+'/wohnideen.html',{waitUntil:'networkidle'});await p.waitForTimeout(700);
let s=await st(p);const R=await p.evaluate(()=>sdWohnideen.raeume());
ok(R.length>=40&&s.n===R.length,'Räume im Feed: '+R.length+', Zähler stimmt');
ok(s.y===0&&s.a===R[0]&&s.nr==='1'&&s.h==='#raum-'+R[0],'Start beim ersten Raum, Adresse zeigt ihn: '+s.h);
ok(await p.evaluate(()=>document.querySelectorAll('#ed-ag a[data-n]').length)===R.length,'Übersicht hat gleich viele Räume');
ok(await p.evaluate(()=>{const h=document.querySelectorAll('.ed-s[data-n] h2');return [...h].every(x=>x.textContent.trim().length>20)}),'Jeder Raum hat einen Tipp');
ok(await p.evaluate(()=>[...document.querySelectorAll('.ed-s[data-n]')].every(x=>/^([^#,]+#[0-9a-f]{6},){4}[^#,]+#[0-9a-f]{6}$/.test(x.dataset.p))),'Jeder Raum hat fünf Farben');
ok(await p.evaluate(()=>[...document.querySelectorAll('.ed-s[data-n] .ed-zu')].every(a=>/\.html(#[\w-]+)?$|^\.\/(#[\w-]+)?$/.test(a.getAttribute('href'))&&a.getAttribute('aria-label').length>12)),'Jeder Raum führt zu seinem Ratgeber');
ok(await p.evaluate(()=>{const L=[...document.querySelectorAll('.ed-s[data-n]')];for(let i=1;i<L.length;i++)if(L[i].dataset.s===L[i-1].dataset.s)return false;return true}),'Nie zwei Fotos derselben Seite hintereinander');
ok(await p.evaluate(()=>!!document.querySelector('.ed-s.akt .ed-b .ki-marke')),'KI-Marke im Bild');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-s.akt .ed-t')).opacity==='1'),'Text des ersten Raums ist sichtbar');
ok(await p.evaluate(()=>document.querySelector('.ed-s.akt .ed-b img').complete&&document.querySelector('.ed-s.akt .ed-b img').naturalWidth>900),'Erstes Bild ist geladen, große Fassung');
// Tastatur
await p.keyboard.press('ArrowDown');await ruhig(p);s=await st(p);ok(s.y===900&&s.a===R[1]&&s.nr==='2'&&s.h==='#raum-'+R[1],'Pfeil runter: zweiter Raum, Zähler und Adresse folgen');
ok(await p.evaluate(()=>{const L=document.querySelectorAll('.ed-s[data-n]');return L[2].querySelector('.ed-b img').loading==='eager'&&L[3].querySelector('.ed-b img').loading==='eager'}),'Die nächsten zwei Bilder laden vor');
await p.keyboard.press('PageDown');await ruhig(p);await p.keyboard.press(' ');await ruhig(p);s=await st(p);ok(s.a===R[3],'Bild ab und Leertaste gehen weiter');
await p.keyboard.press('ArrowUp');await ruhig(p);s=await st(p);ok(s.a===R[2],'Pfeil hoch geht zurück');
// Mausrad
await p.mouse.move(700,450);await p.mouse.wheel(0,100);await ruhig(p);s=await st(p);ok(s.a===R[3],'Ein Rad-Schritt = ein Raum weiter');
await p.mouse.wheel(0,-100);await ruhig(p);s=await st(p);ok(s.a===R[2],'Rad zurück');
for(const x of [4,9,18,30,44,60,70,64,58,52,46,41,36,32,28,25,22,19,17,15,13,11,10,9,8,7,6,5,5,4,4,3,3,2,2,2,1,1,1,1]){await p.mouse.wheel(0,x);await p.waitForTimeout(16)}
await ruhig(p,1500);s=await st(p);ok(s.a===R[3],'Tastfeld-Wischer mit Auslauf = genau ein Raum weiter');
// Merken
await p.click('.ed-s.akt .ed-herz');
ok(await p.getAttribute('.ed-s.akt .ed-herz','aria-pressed')==='true'&&JSON.parse(await p.evaluate(()=>localStorage.getItem('sdmerk'))).join()===R[3],'Herz merkt den Raum (nur im Browser)');
ok(await p.textContent('#ed-bz')==='1'&&!(await p.evaluate(()=>document.getElementById('ed-bz').hidden)),'Zahl am Knopf „Alle Räume“');
await p.click('.ed-s.akt .ed-herz');ok(await p.getAttribute('.ed-s.akt .ed-herz','aria-pressed')==='false'&&await p.evaluate(()=>localStorage.getItem('sdmerk'))==='[]','Zweiter Klick entfernt ihn wieder');
await p.mouse.click(700,330);await p.waitForTimeout(90);await p.mouse.click(702,331);await p.waitForTimeout(300);
ok(await p.getAttribute('.ed-s.akt .ed-herz','aria-pressed')==='true'&&await p.evaluate(()=>!!document.querySelector('.ed-s.akt .ed-puff')),'Doppelklick aufs Bild merkt und zeigt das Herz');
await p.keyboard.press('ArrowDown');await ruhig(p);await p.keyboard.press('m');ok((await p.evaluate(()=>sdWohnideen.gemerkt())).join()===R[3]+','+R[4],'Taste M merkt den nächsten');
// Farbkarte
await p.click('.ed-s.akt button.ed-pal');await p.waitForTimeout(700);
const fk=await p.evaluate(()=>{const s=document.querySelector('.ed-s.akt'),k=s.querySelector('.ed-fk'),B=[...k.querySelectorAll('button[data-hex]')];return {n:B.length,hex:B.every(b=>/^#[0-9A-F]{6}$/.test(b.dataset.hex)),name:B.every(b=>b.querySelector('b').textContent.length>2),link:k.querySelector('a').getAttribute('href'),exp:s.querySelector('.ed-pal').getAttribute('aria-expanded'),sicht:!k.hidden&&k.getBoundingClientRect().height>60}});
ok(fk.n===5&&fk.hex&&fk.name&&fk.sicht&&fk.exp==='true','Farbkarte öffnet: fünf Farben mit Namen und Farbwert');
ok(/^wandfarbe-testen\.html\?mix=([0-9a-f]{6}-[^,]+,){4}[0-9a-f]{6}-[^,]+$/.test(fk.link),'Farbkarte verlinkt ins Wandfarben-Studio: '+fk.link.slice(0,60)+'…');
const kon=await p.evaluate(()=>{const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
  const rgb=s=>'#'+s.match(/\d+/g).slice(0,3).map(v=>('0'+(+v).toString(16)).slice(-2)).join('');
  return Math.min(...[...document.querySelectorAll('.ed-s.akt .ed-fk button[data-hex]')].map(b=>{const a=lum(b.dataset.hex.toLowerCase()),t=lum(rgb(getComputedStyle(b).color));return (Math.max(a,t)+.05)/(Math.min(a,t)+.05)}))});
ok(kon>=4.5,'Schrift auf den Farbfeldern hat genug Kontrast (kleinster Wert '+kon.toFixed(1)+')');
await p.click('.ed-s.akt .ed-fk button[data-hex]');await p.waitForTimeout(300);ok(/kopiert|Farbwert/.test(await p.textContent('.toast')),'Antippen einer Farbe meldet den Farbwert');
await p.keyboard.press('ArrowDown');await ruhig(p);ok(await p.evaluate(()=>[...document.querySelectorAll('.ed-fk')].every(k=>k.hidden)),'Farbkarte schließt beim Weitergehen');
// Teilen
ok(await p.evaluate(()=>{const t=document.querySelector('.ed-s.akt .ed-teil');return t.hasAttribute('data-share')&&/^Wohnidee von Stil-Daheim: /.test(t.dataset.shareText)&&t.dataset.shareUrl.endsWith('/wohnideen.html#'+document.querySelector('.ed-s.akt').id)}),'Teilen-Knopf trägt Tipp und Adresse des Raums');
// Alle Räume
await p.click('#ed-auf');await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.getElementById('ed-alle').open&&document.getElementById('ed-alle').matches(':modal')),'„Alle Räume“ öffnet als Fenster');
ok(await p.evaluate(()=>!!document.querySelector('#ed-alle .ki-hinweis')&&!document.querySelector('#ed-ag .ki-marke')),'Übersicht: eine Zeile „Bilder mit KI erstellt“, keine Marken auf den Kacheln');
ok(await p.evaluate(()=>document.querySelector('#ed-ag a.da').dataset.n===sdWohnideen.aktiv()),'Der aktuelle Raum ist in der Übersicht markiert');
await p.click('#ed-af [data-f="stile"]');let nS=await p.evaluate(()=>[...document.querySelectorAll('#ed-ag a:not([hidden])')].map(a=>a.dataset.k));ok(nS.length>=10&&nS.every(k=>k==='stile'),'Filter Wohnstile: '+nS.length+' Räume');
await p.click('#ed-af [data-f="gm"]');await p.waitForTimeout(300);
ok((await p.evaluate(()=>[...document.querySelectorAll('#ed-ag a:not([hidden])')].map(a=>a.dataset.n))).sort().join()===[R[3],R[4]].sort().join(),'Filter Gemerkt zeigt genau die zwei gemerkten');
ok(/Gemerkt \(2\)/.test(await p.textContent('#ed-af [data-f="gm"]')),'Knopf zeigt „Gemerkt (2)“');
const fw=await p.evaluate(()=>{const f=document.getElementById('ed-fw');return {da:!f.hidden,n:f.querySelectorAll('button[data-hex]').length,t:f.textContent,l:[...f.querySelectorAll('.ed-fws a')].map(a=>a.getAttribute('href'))}});
ok(fw.da&&fw.n===5&&/Deine Farbwelt/.test(fw.t)&&/2 gemerkten Räumen/.test(fw.t),'Farbwelt aus den gemerkten Räumen: fünf Farben');
ok(/Am nächsten liegt der Stil (Vintage|Modern|Skandinavisch|Japandi|Industrial|Boho)/.test(fw.t)&&fw.l.length===2&&/^(vintage|modern|skandinavisch|japandi|industrial|boho)\.html$/.test(fw.l[0])&&/^wandfarbe-testen\.html\?mix=/.test(fw.l[1]),'Farbwelt nennt den nächsten Stil und verlinkt Stil und Studio');
await p.click('#ed-af [data-f=""]');const ziel=R.slice(10).find(n=>!/^(kaffee|matcha)$/.test(n)),zi=R.indexOf(ziel);await p.click('#ed-ag a[data-n="'+ziel+'"]');await p.waitForTimeout(600);s=await st(p);
ok(s.a===ziel&&s.nr===String(zi+1)&&!(await p.evaluate(()=>document.getElementById('ed-alle').open)),'Klick in der Übersicht springt zum Raum und schließt das Fenster');
await p.click('#ed-auf');await p.keyboard.press('Escape');await p.waitForTimeout(200);ok(!(await p.evaluate(()=>document.getElementById('ed-alle').open)),'Escape schließt die Übersicht');
// Bewegung
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-s.akt .ed-b img')).animationName==='edz'),'Querformat: Bild wächst sacht (nur der sichtbare Raum)');
await p.click('#ed-ruhe');ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-s.akt .ed-b img')).animationPlayState==='paused'&&document.getElementById('ed-ruhe').getAttribute('aria-pressed')==='true'&&localStorage.getItem('sdruhe')==='1'),'Knopf hält die Bewegung an und merkt sich das');
await p.click('#ed-ruhe');ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-s.akt .ed-b img')).animationPlayState==='running'&&localStorage.getItem('sdruhe')===null),'Zweiter Klick startet sie wieder');
// Ende und Fußzeile
await p.keyboard.press('End');await ruhig(p,2600);
ok(await p.evaluate(()=>{const r=document.getElementById('ende').getBoundingClientRect();return Math.abs(r.top)<2})&&await p.evaluate(()=>document.querySelectorAll('#ed-egm .ed-egl a').length)===2,'Ende: Abschluss mit den zwei gemerkten Räumen');
await p.keyboard.press('ArrowDown');await ruhig(p,1500);
ok(await p.evaluate(()=>{const f=document.querySelector('body>footer').getBoundingClientRect();return f.top<innerHeight*.5&&document.documentElement.classList.contains('ed-unten')&&getComputedStyle(document.querySelector('.ed-top')).visibility==='hidden'}),'Fußzeile erreichbar, Leiste oben blendet dort aus');
ok(await p.evaluate(()=>{const a=document.querySelector('body>footer a[href="impressum.html"]');const r=a.getBoundingClientRect();document.body.scrollTop=1e7;const q=a.getBoundingClientRect();return q.top>100&&q.bottom<innerHeight}),'Impressum-Link in der Fußzeile ist zu sehen');
await p.mouse.wheel(0,-100);await ruhig(p,900);await p.mouse.wheel(0,-100);await ruhig(p,900);await p.mouse.wheel(0,-100);await ruhig(p,1500);
ok(await p.evaluate(()=>!document.documentElement.classList.contains('ed-unten')),'Rad zurück führt aus der Fußzeile wieder zu den Räumen');
await p.evaluate(()=>document.getElementById('ende').scrollIntoView({behavior:'instant'}));await p.waitForTimeout(400);
const vorher=(await p.evaluate(()=>sdWohnideen.raeume())).join();await p.click('#ed-neu');await p.waitForTimeout(700);s=await st(p);const neuR=await p.evaluate(()=>sdWohnideen.raeume());
ok(neuR.join()!==vorher&&neuR.slice().sort().join()===R.slice().sort().join()&&s.y===0&&s.nr==='1'&&s.a===neuR[0],'Neu mischen: gleiche Räume, neue Reihenfolge, wieder am Anfang');
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.body.scrollWidth<=document.body.clientWidth),'Kein seitliches Scrollen (PC)');
await c.close();

/* ---------- Adresse mit Raum, Reihenfolge des Tages, Saison ---------- */
[c,p]=await neu({viewport:{width:1280,height:800}});
await p.goto(B+'/wohnideen.html#raum-japandi',{waitUntil:'networkidle'});await p.waitForTimeout(500);s=await st(p);const R2=await p.evaluate(()=>sdWohnideen.raeume());
ok(s.a==='japandi'&&s.nr==='1'&&s.y===0&&R2[0]==='japandi','Adresse #raum-japandi: dieser Raum steht vorn');
const k=R.indexOf('japandi');ok(R2.join()===R.slice(k).concat(R.slice(0,k)).join(),'Rest der Reihenfolge bleibt die des Tages');
await p.evaluate(()=>{location.hash='#gemerkt'});await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.getElementById('ed-alle').open&&document.querySelector('#ed-af [data-f="gm"]').getAttribute('aria-pressed')==='true'&&!document.getElementById('ed-leer').hidden),'Adresse #gemerkt öffnet die gemerkten (leer: Hinweis, wie es geht)');
await c.close();
[c,p]=await neu({viewport:{width:1280,height:800}});await p.addInitScript(()=>{try{if(!localStorage.getItem('sdmerk'))localStorage.setItem('sdmerk','["japandi","boho","licht"]')}catch(e){}});
await p.goto(B+'/wohnideen.html#gemerkt',{waitUntil:'networkidle'});await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.getElementById('ed-alle').open&&document.querySelectorAll('#ed-ag a:not([hidden])').length===3&&!document.getElementById('ed-fw').hidden&&document.getElementById('ed-bz').textContent==='3'),'Frisch geladen mit #gemerkt: Fenster offen, drei gemerkte Räume und Farbwelt');
await c.close();
const amTag=async(tag)=>{const [c,p]=await neu({viewport:{width:1280,height:800}});await p.clock.install({time:new Date(tag+'T12:00:00')});await p.goto(B+'/wohnideen.html',{waitUntil:'load'});await p.waitForTimeout(400);const r=await p.evaluate(()=>sdWohnideen.raeume());await c.close();return r};
const heute=await amTag('2026-11-21'),nochmal=await amTag('2026-11-21'),morgen=await amTag('2026-11-22'),juli=await amTag('2027-07-10'),silv=await amTag('2026-12-31');
ok(heute.join()===nochmal.join(),'Gleicher Tag = gleiche Reihenfolge');
ok(heute.join()!==morgen.join()&&heute.slice().sort().join()===morgen.slice().sort().join(),'Nächster Tag = neu gemischt, gleiche Räume');
ok(!juli.some(n=>/weihnachten|adventskranz|tischdeko|geschenke|silvester|pflanzen/.test(n))&&juli.includes('japandi')&&juli.length<heute.length,'Im Juli ohne Advent, Weihnachten, Silvester und Winterpflanzen ('+juli.length+' Räume)');
ok(silv.includes('silvester')&&silv.includes('silvester-2')&&!silv.includes('weihnachten')&&!silv.includes('adventskranz'),'An Silvester mit Silvester-Tisch, ohne Weihnachten');

/* ---------- Film im Feed ---------- */
[c,p]=await neu({viewport:{width:1280,height:800}});
await p.goto(B+'/wohnideen.html#raum-kaffee',{waitUntil:'networkidle'});
await p.waitForFunction(()=>{const v=document.querySelector('.ed-s.akt video');return v&&!v.paused&&v.readyState>2},null,{timeout:15000}).catch(()=>{});
ok(await p.evaluate(()=>{const v=document.querySelector('#raum-kaffee video');return !v.paused&&v.muted&&v.classList.contains('an')&&/kaffee\.(mp4|webm)$/.test(v.currentSrc)}),'Kaffee-Raum: Film läuft stumm über dem Standbild');
ok(await p.evaluate(()=>{const v=document.querySelector('#raum-matcha video');return v.paused&&!v.currentSrc}),'Matcha-Film lädt erst, wenn er dran ist');
await p.click('#ed-ruhe');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelector('#raum-kaffee video').paused),'„Bewegung anhalten“ hält auch den Film an');
await c.close();

/* ---------- Feed auf dem Handy ---------- */
[c,p]=await neu({...devices['iPhone 13'],viewport:{width:390,height:760}});
await p.goto(B+'/wohnideen.html#raum-wohnzimmer',{waitUntil:'networkidle'});await p.waitForTimeout(900);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=document.body.clientWidth),'Kein seitliches Scrollen (Handy)');
const xw=()=>p.evaluate(()=>new DOMMatrix(getComputedStyle(document.querySelector('.ed-s.akt .ed-b img')).transform).m41);
const g=await p.evaluate(()=>{const i=document.querySelector('.ed-s.akt .ed-b img').getBoundingClientRect();return {w:i.width,h:i.height}});
ok(g.w>1200&&Math.abs(g.h-760)<2,'Hochformat: Bild füllt die Höhe und ist breiter als der Bildschirm ('+Math.round(g.w)+' px)');
const x1=await xw();await p.waitForTimeout(1600);const x2=await xw();ok(Math.abs(x2-x1)>12&&Math.abs(x2-x1)<80,'Kamerafahrt: Bild wandert langsam zur Seite ('+Math.abs(x2-x1).toFixed(0)+' px in 1,6 s)');
await p.tap('#ed-ruhe');const x3=await xw();await p.waitForTimeout(800);ok(Math.abs((await xw())-x3)<.5,'Anhalten stoppt die Kamerafahrt');
await p.tap('#ed-ruhe');
// Ziehen mit dem Finger (seitlich): Bild folgt
const cdp=await c.newCDPSession(p);const tch=(t,x,y)=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:t==='touchEnd'?[]:[{x,y}]});
const x4=await xw();await tch('touchStart',300,300);for(let i=1;i<=10;i++){await tch('touchMove',300-i*12,300);await p.waitForTimeout(16)}await tch('touchEnd');await p.waitForTimeout(100);const x5=await xw();
ok(x5<x4-90&&x5>x4-140,'Seitlich ziehen bewegt das Bild mit dem Finger ('+Math.round(x4-x5)+' px)');
// Wischen nach oben: nächster Raum
const a0=(await st(p)).a;await tch('touchStart',200,600);for(let i=1;i<=12;i++){await tch('touchMove',200,600-i*40);await p.waitForTimeout(12)}await tch('touchEnd');await ruhig(p,1500);
s=await st(p);ok(s.a!==a0&&s.nr==='2'&&s.y===760,'Nach oben wischen rastet beim nächsten Raum ein');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-s.akt .ed-t')).opacity==='1'&&document.querySelector('.ed-s.akt').classList.contains('war')),'Text des neuen Raums ist eingeblendet');
await p.tap('.ed-s.akt button.ed-pal');await p.waitForTimeout(700);
ok(await p.evaluate(()=>{const s=document.querySelector('.ed-s.akt'),h=s.querySelector('h2').getBoundingClientRect(),hd=document.getElementById('hd').getBoundingClientRect(),k=s.querySelector('.ed-fk').getBoundingClientRect();return k.height>150&&h.top>hd.bottom&&k.right<=innerWidth}),'Handy: offene Farbkarte bleibt unter der Kopfzeile und im Bild');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-top')).visibility==='hidden'),'Handy: Leiste oben macht der Farbkarte Platz');
await p.tap('.ed-s.akt button.ed-pal');
await p.tap('#ed-auf');await p.waitForTimeout(500);
ok(await p.evaluate(()=>{const d=document.getElementById('ed-alle').getBoundingClientRect();return d.width===innerWidth&&d.height>=innerHeight-1&&getComputedStyle(document.getElementById('ed-ag')).gridTemplateColumns.split(' ').length===2}),'Handy: Übersicht füllt den Bildschirm, zwei Spalten');
await c.close();

/* ---------- Bewegung reduzieren, ohne Skript ---------- */
[c,p]=await neu({...devices['iPhone 13'],viewport:{width:390,height:760},reducedMotion:'reduce'});
await p.goto(B+'/wohnideen.html',{waitUntil:'networkidle'});await p.waitForTimeout(600);
const r1=await p.evaluate(()=>new DOMMatrix(getComputedStyle(document.querySelector('.ed-s.akt .ed-b img')).transform).m41);await p.waitForTimeout(900);
ok(Math.abs(r1-await p.evaluate(()=>new DOMMatrix(getComputedStyle(document.querySelector('.ed-s.akt .ed-b img')).transform).m41))<.5&&await p.evaluate(()=>getComputedStyle(document.getElementById('ed-ruhe')).display==='none'&&!document.querySelector('.ed-hint')),'„Bewegung reduzieren“: keine Kamerafahrt, kein Hinweis, kein Pausenknopf nötig');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.ed-s.akt .ed-t')).opacity==='1'&&getComputedStyle(document.querySelector('.ed-s.akt h2')).animationName==='none'),'„Bewegung reduzieren“: Text steht sofort da');
await c.close();
[c,p]=await neu({viewport:{width:1280,height:800},javaScriptEnabled:false});
await p.goto(B+'/wohnideen.html',{waitUntil:'load'});
const oj=await p.evaluate(()=>({n:document.querySelectorAll('.ed-s[data-n]').length,t:getComputedStyle(document.querySelector('.ed-s[data-n] .ed-t')).opacity,pal:document.querySelector('.ed-s[data-n] a.ed-pal').getAttribute('href'),kn:getComputedStyle(document.querySelector('.ed-kn')).display,z:document.getElementById('ed-z').innerText,sc:getComputedStyle(document.body).overflowY}));
ok(oj.n>=50&&oj.t==='1'&&/^wandfarbe-testen\.html\?mix=/.test(oj.pal)&&oj.kn==='none'&&/^\d+ Räume$/.test(oj.z.trim()),'Ohne Skript: alle Räume mit Tipp und Links, Knöpfe ohne Funktion sind weg ('+oj.z.trim()+')');
await c.close();

/* ---------- Wandfarben-Studio nimmt die Farben des Raums ---------- */
[c,p]=await neu({viewport:{width:1280,height:900}});
await p.goto(B+'/wohnideen.html#raum-japandi',{waitUntil:'networkidle'});const mix=await p.evaluate(()=>document.querySelector('#raum-japandi').dataset.p.split(',').map(t=>t.split('#')));
await p.click('#raum-japandi button.ed-pal');await p.waitForTimeout(400);await p.click('#raum-japandi .ed-fk a');await p.waitForFunction(()=>/wandfarbe-testen/.test(location.pathname)&&document.querySelector('.st-dots button, .st [data-c]'),null,{timeout:15000}).catch(()=>{});await p.waitForTimeout(800);
const sd=await p.evaluate(()=>[...document.querySelectorAll('.st button[data-c]')].map(b=>(b.dataset.c||'').toLowerCase()));
ok(mix.every(m=>sd.includes('#'+m[1].toLowerCase())),'Studio zeigt die fünf Farben des Raums zur Auswahl');
await c.close();

/* ---------- Startseite: Bühne, Schaufenster, Duell ---------- */
[c,p]=await neu({viewport:{width:1440,height:900}});
await p.goto(B+'/',{waitUntil:'networkidle'});await p.waitForTimeout(3300);
ok(await p.evaluate(()=>['.hero h1','.hero .wrap>p','.hero .btns'].every(q=>getComputedStyle(document.querySelector(q)).opacity==='1')&&new DOMMatrix(getComputedStyle(document.querySelector('.hero>picture img')).transform).a===1),'Bühne: Titel, Text und Knöpfe stehen, Foto ist zur Ruhe gekommen');
ok((await p.$$eval('.hero .btns a',A=>A.map(a=>a.textContent.trim()))).join('|')==='Meinen Stil finden|Wandfarbe testen|Raum planen|Kaffee-Ecke','Bühne: alle vier Knöpfe wie gewünscht');
ok(await p.evaluate(()=>document.querySelector('.hdim').classList.contains('on')&&getComputedStyle(document.querySelector('.hdim .lbl')).opacity==='1'),'Maßlinie „Sofa 240 cm“ ist gezeichnet');
const karten=await p.$$eval('#sf-t .sf-c',A=>A.map(a=>({h:a.getAttribute('href'),b:a.querySelector('b').textContent,p:a.querySelectorAll('.sf-p i').length,src:a.querySelector('img').getAttribute('src'),alt:a.querySelector('img').alt})));
ok(karten.length===16&&karten.every(k=>/^wohnideen\.html#raum-[\w-]+$/.test(k.h)&&k.b.length>2&&k.p===5&&/^assets\/[\w-]+-h\.webp$/.test(k.src)&&k.alt.length>15),'Schaufenster: 16 Karten mit Name, Farbstreifen und Ziel im Feed');
ok(new Set(karten.map(k=>k.b)).size===16,'Schaufenster: je Seite höchstens ein Raum');
ok(await p.evaluate(()=>!!document.querySelector('#schaufenster .ki-hinweis')&&!document.querySelector('#sf .ki-marke')&&document.querySelectorAll('#schaufenster .ki-hinweis').length===1),'Schaufenster: eine Zeile „Bilder mit KI erstellt“');
ok(karten.every(k=>R.concat(['silvester','silvester-2']).includes(k.h.split('#raum-')[1])),'Schaufenster-Ziele gibt es im Feed');
await p.evaluate(()=>document.getElementById('schaufenster').scrollIntoView({behavior:'instant',block:'center'}));await p.mouse.move(10,10);await p.waitForTimeout(600);
const tx=()=>p.evaluate(()=>new DOMMatrix(getComputedStyle(document.getElementById('sf-t')).transform).m41);
const t1=await tx();await p.waitForTimeout(1500);const t2=await tx();ok(t2<t1-10&&t2>t1-60,'Schaufenster zieht langsam vorbei ('+Math.round(t1-t2)+' px in 1,5 s)');
await p.hover('#sf');await p.waitForTimeout(300);const t3=await tx();await p.waitForTimeout(700);ok(Math.abs((await tx())-t3)<.5,'Maus über der Reihe hält sie an');
await p.click('[data-sf="1"]');await p.waitForTimeout(900);ok(await p.evaluate(()=>document.getElementById('sf').scrollLeft>200&&getComputedStyle(document.getElementById('sf-t')).transform==='none'),'Pfeil rechts: Reihe gehört jetzt dem Besucher und rollt weiter');
// Karte -> Feed
const kz=await p.evaluate(()=>{const s=document.getElementById('sf').getBoundingClientRect();const a=[...document.querySelectorAll('.sf-c')].find(a=>{const r=a.getBoundingClientRect();return r.left>s.left+40&&r.right<s.right-40});return a.getAttribute('href').split('#raum-')[1]});
await p.click('.sf-c[href$="#raum-'+kz+'"]');await p.waitForFunction(()=>/wohnideen\.html/.test(location.pathname)&&window.sdWohnideen,null,{timeout:15000});await p.waitForTimeout(900);s=await st(p);
ok(s.a===kz&&s.nr==='1','Karte „'+kz+'“ öffnet den Feed bei diesem Raum');
await p.goBack();await p.waitForTimeout(800);
// Duell
await p.evaluate(()=>{localStorage.removeItem('sdquiz')});await p.reload({waitUntil:'networkidle'});
await p.evaluate(()=>document.getElementById('quiz').scrollIntoView({behavior:'instant',block:'center'}));await p.waitForTimeout(500);
ok(/Runde 1 von 6/.test(await p.textContent('#quiz .q-top'))&&await p.evaluate(()=>document.querySelectorAll('#quiz .dl-b').length)===2,'Stil-Finder startet als Bilder-Duell');
ok(await p.evaluate(()=>[...document.querySelectorAll('#quiz .dl-b img')].every(i=>i.alt.length>20&&i.complete&&i.naturalWidth>300)&&document.querySelectorAll('#quiz .dl-b .ki-marke').length===2),'Duell-Bilder geladen, mit Beschreibung und KI-Marke');
const waehle=async(stil)=>{await p.click('#quiz .dl-b[data-k="'+stil+'"]');await p.waitForTimeout(650)};
const runde=()=>p.evaluate(()=>[...document.querySelectorAll('#quiz .dl-b')].map(b=>b.dataset.k).sort().join('-'));
const paare=[];for(const w of ['vintage','skandinavisch','japandi','modern','japandi','vintage']){paare.push(await runde());await waehle(w)}
ok(paare.join()==='modern-vintage,industrial-skandinavisch,boho-japandi,boho-modern,industrial-japandi,skandinavisch-vintage','Sechs Runden, jeder Stil tritt zweimal an');
ok(/Stechen/.test(await p.textContent('#quiz .q-top'))&&await runde()==='japandi-vintage','Gleichstand (Vintage und Japandi je 2): Stechen zwischen beiden');
await p.click('#quiz [data-back]');await p.waitForTimeout(400);ok(/Runde 6 von 6/.test(await p.textContent('#quiz .q-top')),'Zurück führt eine Runde zurück');
await waehle('vintage');await waehle('japandi');await p.waitForTimeout(900);
ok(await p.textContent('#quiz .q-res h3')==='Japandi'&&/Japandi[\s\S]*3\s*von\s*3/.test(await p.evaluate(()=>document.querySelector('#quiz .q-mix').innerText)),'Ergebnis Japandi, „3 von 3“ in der Übersicht');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('sdquiz')).d.join()==='vintage,skandinavisch,japandi,modern,japandi,vintage,japandi'),'Ergebnis im Browser gemerkt');
const er=await p.evaluate(()=>({btn:[...document.querySelectorAll('#quiz .q-res .btns a')].map(a=>a.getAttribute('href')),starts:[...document.querySelectorAll('#quiz .starts a')].map(a=>[a.href,a.rel,a.target]),tag:!!document.querySelector('#quiz .starts .tag')}));
ok(er.btn[0]==='japandi.html'&&/^wandfarbe-testen\.html\?mix=/.test(er.btn[1])&&er.btn[2]==='wohnideen.html#raum-japandi','Ergebnis verlinkt Stil, Studio und Wohnideen');
ok(er.starts.length===3&&er.tag&&er.starts.every(x=>/amazon\.de|awin1\.com/.test(x[0])&&/sponsored/.test(x[1])&&/nofollow/.test(x[1])&&x[2]==='_blank'),'Drei Startstücke als Partnerlinks, mit „Anzeige“ gekennzeichnet');
await p.reload({waitUntil:'networkidle'});ok(await p.evaluate(()=>document.querySelector('#quiz .q-res h3')&&document.querySelector('#quiz .q-res h3').textContent==='Japandi'),'Nach dem Neuladen steht das Ergebnis wieder da');
ok(/Dein Stil-Ergebnis/.test(await p.textContent('#weiter')),'„Weitermachen“ zeigt das Stil-Ergebnis');
await p.evaluate(()=>document.getElementById('quiz').scrollIntoView({behavior:'instant',block:'center'}));await p.click('#quiz [data-again]');await p.waitForTimeout(500);
ok(/Runde 1 von 6/.test(await p.textContent('#quiz .q-top'))&&await p.evaluate(()=>localStorage.getItem('sdquiz')===null),'„Noch einmal“ beginnt von vorn');
await p.click('#quiz [data-art="fragen"]');await p.waitForTimeout(400);ok(/Frage 1 von 5/.test(await p.textContent('#quiz .q-top')),'Die fünf Fragen gibt es weiter als zweiten Weg');
for(let i=0;i<5;i++){await p.click('#quiz .q-opts button:first-child');await p.waitForTimeout(450)}await p.waitForTimeout(600);
ok(!!(await p.textContent('#quiz .q-res h3'))&&/aus deinen fünf Antworten/.test(await p.textContent('#quiz .q-mix'))&&await p.evaluate(()=>Array.isArray(JSON.parse(localStorage.getItem('sdquiz')))),'Fragen-Weg liefert ein Ergebnis (altes Speicherformat bleibt gültig)');
// Gemerkte auf der Startseite
await p.evaluate(()=>localStorage.setItem('sdmerk','["japandi","boho"]'));await p.reload({waitUntil:'networkidle'});
ok(await p.evaluate(()=>{const a=document.querySelector('#weiter a[href="wohnideen.html#gemerkt"]');return a&&/Gemerkte Räume \(2\)/.test(a.textContent)}),'„Weitermachen“ zeigt die gemerkten Räume');
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'Startseite: kein seitliches Scrollen (PC)');
await c.close();
[c,p]=await neu({...devices['iPhone 13']});await p.goto(B+'/',{waitUntil:'networkidle'});await p.waitForTimeout(600);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'Startseite: kein seitliches Scrollen (Handy)');
ok(await p.evaluate(()=>{const B=[...document.querySelectorAll('.hero .btns a')].map(a=>a.getBoundingClientRect());return B.length===4&&Math.abs(B[0].top-B[1].top)<2&&Math.abs(B[2].top-B[3].top)<2&&B[2].top>B[0].bottom&&B.every(r=>r.height>=44&&Math.abs(r.width-B[0].width)<2)}),'Handy: vier Knöpfe als sauberes Zweierraster');
await p.evaluate(()=>document.getElementById('quiz').scrollIntoView({behavior:'instant',block:'center'}));await p.waitForTimeout(600);
ok(await p.evaluate(()=>[...document.querySelectorAll('#quiz .dl-b img')].every(i=>/-h\.webp$/.test(i.currentSrc))&&[...document.querySelectorAll('#quiz .dl-b')].every(b=>{const r=b.getBoundingClientRect();return r.height>r.width*1.2})),'Handy: Duell mit Hochformat-Bildern nebeneinander');
await c.close();
[c,p]=await neu({viewport:{width:1280,height:800},reducedMotion:'reduce'});await p.goto(B+'/',{waitUntil:'networkidle'});await p.waitForTimeout(500);
await p.evaluate(()=>document.getElementById('schaufenster').scrollIntoView({behavior:'instant',block:'center'}));await p.waitForTimeout(900);
ok(await p.evaluate(()=>getComputedStyle(document.getElementById('sf-t')).transform==='none'&&getComputedStyle(document.querySelector('.hero h1')).animationName==='none'),'„Bewegung reduzieren“: Schaufenster und Bühne stehen still');
await c.close();

/* ---------- Einbindung auf den anderen Seiten ---------- */
[c,p]=await neu({viewport:{width:1280,height:800}});
await p.goto(B+'/japandi.html',{waitUntil:'networkidle'});
ok(await p.evaluate(()=>{const a=document.querySelector('.hd .nav a[href="wohnideen.html"]');return a&&a.textContent==='Wohnideen'&&a.getBoundingClientRect().width>0}),'Kopfzeile: „Wohnideen“');
ok(await p.evaluate(()=>new Set([...document.querySelectorAll('.hd .nav a')].filter(a=>a.getBoundingClientRect().width>0).map(a=>Math.round(a.getBoundingClientRect().top))).size===1),'Kopfzeile bricht nicht um (1280 px)');
ok(await p.evaluate(()=>{const a=document.querySelector('.rel-st a');return a&&a.getAttribute('href')==='wohnideen.html#raum-japandi'}),'Ratgeber: Zeile „Wohnideen zum Stöbern“ öffnet den Feed beim eigenen Foto');
ok(await p.evaluate(()=>!!document.querySelector('#msheet a.m-go[href="wohnideen.html"]')&&!!document.querySelector('#msheet a.m-go[href="./#stil-finder"]')&&!!document.querySelector('footer a[href="wohnideen.html"]')),'Menü und Fußzeile führen zu den Wohnideen, Stil-Finder-Link stimmt');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.hero h1')).animationName==='hrise'),'Bühne der Ratgeber: Titel steigt beim Laden auf');
await c.close();
for(const w of [901,1000,1081,1180]){[c,p]=await neu({viewport:{width:w,height:700}});await p.goto(B+'/stile.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(250);
  ok(await p.evaluate(()=>{const A=[...document.querySelectorAll('.hd .nav a')].filter(a=>a.getBoundingClientRect().width>0),l=document.querySelector('.hd .logo').getBoundingClientRect(),t=document.getElementById('th').getBoundingClientRect();
    return A.length>=5&&new Set(A.map(a=>Math.round(a.getBoundingClientRect().top))).size===1&&A[0].getBoundingClientRect().left>=l.right&&A[A.length-1].getBoundingClientRect().right<=t.left+1&&A.every(a=>a.getBoundingClientRect().height<50)&&document.documentElement.scrollWidth<=innerWidth}),'Kopfzeile bei '+w+' px: eine Zeile, nichts überlappt');await c.close()}
[c,p]=await neu({viewport:{width:1280,height:800}});
const sm=await (await p.request.get(B+'/sitemap.xml')).text(),ll=await (await p.request.get(B+'/llms.txt')).text();
ok(/stil-daheim\.de\/wohnideen\.html/.test(sm)&&/wohnideen\.html/.test(ll),'Sitemap und llms.txt kennen die neue Seite');
await p.goto(B+'/wohnideen.html',{waitUntil:'load'});
ok(await p.evaluate(()=>{const m=n=>document.querySelector('meta[property="og:'+n+'"]').content;return /assets\/og\/wohnideen\.jpg$/.test(m('image'))&&document.title.length<70&&document.querySelector('meta[name=description]').content.length<=160&&document.querySelectorAll('h1').length===1&&/"@type": ?"Article"/.test(document.querySelector('script[type="application/ld+json"]').textContent)}),'Titel, Beschreibung, Teilen-Bild und strukturierte Daten der neuen Seite');
await c.close();

ok(errs.length===0,'Keine Skriptfehler'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
ok(fremd.length===0,'Keine fremden Abrufe'+(fremd.length?': '+fremd.slice(0,3).join(' | '):''));
console.log(bad?('\n'+bad+' FEHLER'):'\nALLE TESTS BESTANDEN');await b.close();process.exit(bad?1:0)})();
