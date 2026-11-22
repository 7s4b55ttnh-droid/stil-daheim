// Prüft den Matcha-Ratgeber (matcha.html).  node matcha-test.js [Basis-URL]
const {chromium,devices}=require('playwright');const B=process.argv[2]||'http://localhost:8766';let bad=0;
const ok=(c,t)=>{console.log((c?'ok   ':'FEHLER ')+t);if(!c)bad++};
(async()=>{const b=await chromium.launch();const errs=[],fremd=[];
const neu=async(o)=>{const c=await b.newContext(o);const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
  p.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^data:|^blob:/.test(u)&&!/goatcounter/.test(u))fremd.push(u)});return [c,p]};
let [c,p]=await neu({viewport:{width:1440,height:900}});
const res=await p.goto(B+'/matcha.html',{waitUntil:'networkidle'});ok(res.status()===200,'Seite lädt');await p.waitForTimeout(700);
await p.waitForFunction(()=>{const v=document.getElementById('mt-film');return v&&!v.paused&&v.readyState>2},null,{timeout:15000}).catch(()=>{});
ok(await p.evaluate(()=>{const v=document.getElementById('mt-film');return !!v.__kf&&!v.paused&&v.classList.contains('an')&&/assets\/matcha\.(mp4|webm)$/.test(v.currentSrc)&&v.muted}),'Kopfbild-Film läuft, stumm');
ok(await p.evaluate(()=>!!document.querySelector('.mt-hero .ki-marke')),'KI-Marke im Kopfbild');
await p.click('[data-kaffee-pause="mt-film"]');await p.waitForTimeout(250);ok(await p.evaluate(()=>document.getElementById('mt-film').paused),'Pause-Knopf hält den Film an');
ok(await p.$$eval('#zubereiten .steps>li',L=>L.length===6)&&await p.$$eval('#zubereiten .mt-z b',L=>L.map(x=>x.textContent.replace(/\s/g,' ')).join('|')==='1,5 g|70 ml|75–80 °C'),'Anleitung: sechs Schritte und die drei Zahlen');
ok(await p.$$eval('.mt-k li',L=>L.length===6)&&await p.$$eval('.mt-w>div',L=>L.length===4)&&await p.$$eval('.mt-a article',L=>L.length===4),'Herstellung in sechs Schritten, vier Werkzeuge, vier Arten');
ok(await p.evaluate(()=>{const s=document.getElementById('iced-matcha-latte');return !!s&&s.querySelectorAll('.steps>li').length===4&&[...s.querySelectorAll('.mt-z b')].map(x=>x.textContent.replace(/\s/g,' ')).join('|')==='3 g|100 ml|100 ml'&&!!s.querySelector('.mt-glas svg[role="img"]')&&!!document.querySelector('.mt-a a[href="#iced-matcha-latte"]')&&!!document.querySelector('.toc a[href="#iced-matcha-latte"]')&&/Wenn es nicht schmeckt/.test(document.getElementById('zubereiten').textContent)}),'Iced Matcha Latte: Rezept mit vier Schritten, drei Mengen, Zeichnung, im Inhalt verlinkt');
ok(await p.evaluate(()=>{const s=document.querySelector('.mt-sk'),o=s.querySelector('.sk-o').getBoundingClientRect(),r=s.getBoundingClientRect();return s.getAttribute('role')==='img'&&/75 bis 80 Grad/.test(s.getAttribute('aria-label'))&&Math.abs((o.left-r.left)/r.width-.375)<.01&&Math.abs(o.width/r.width-.125)<.01}),'Temperaturskala: 75 bis 80 Grad markiert, mit Beschreibung');
// Rechner
const out=()=>p.evaluate(()=>['mr-p','mr-k','mr-d','mr-h'].map(i=>document.getElementById(i).textContent));
let o=await out();ok(o[0]==='3 g'&&o[1]==='42 bis 108 mg'&&o[2]==='10 Tage'&&/innerhalb/.test(o[3]),'Rechner Start (2 Schalen, 1,5 g): '+o.slice(0,3).join(', '));
await p.selectOption('#mr-n','4');await p.selectOption('#mr-g','2');o=await out();ok(o[0]==='8 g'&&o[1]==='112 bis 288 mg'&&o[2]==='3 Tage'&&/mehr als die 3 Gramm/.test(o[3]),'Rechner 4 Schalen mit 2 g: '+o.slice(0,3).join(', ')+', Hinweis auf die Empfehlung');
await p.selectOption('#mr-n','1');await p.selectOption('#mr-g','3');o=await out();ok(o[0]==='3 g'&&o[1]==='42 bis 108 mg'&&o[2]==='10 Tage','Rechner 1 Glas Iced Matcha Latte mit 3 g: '+o.slice(0,3).join(', '));
await p.selectOption('#mr-n','1');await p.selectOption('#mr-g','1');o=await out();ok(o[0]==='1 g'&&o[1]==='14 bis 36 mg'&&o[2]==='30 Tage','Rechner 1 Schale mit 1 g: '+o.slice(0,3).join(', '));
// Links
const L=await p.$$eval('#einkauf a.item',A=>A.map(a=>({h:a.href,r:a.rel,t:a.target,an:/Anzeige/.test(a.textContent)})));
ok(L.length===6&&L.every(l=>/sponsored/.test(l.r)&&/nofollow/.test(l.r)&&l.t==='_blank'&&l.an&&/amazon\.de\/s\?.*tag=stildaheim-21/.test(l.h)),'Sechs Einkaufslinks: Amazon mit Partner-Kennung, Anzeige, rel="sponsored nofollow"');
ok(await p.$$eval('#quellen .src li, #quellen li',A=>A.length>=14),'Quellen sind genannt');
ok(await p.evaluate(()=>!/entgiftet|heilt|Superfood|Testsieger/i.test(document.querySelector('main').textContent)),'Keine Heilversprechen, kein „Testsieger“');
ok(await p.evaluate(()=>{const j=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent).join(' ');return /FAQPage/.test(j)&&/Article|WebPage/.test(j)}),'Strukturierte Daten (Artikel, Fragen)');
ok(await p.evaluate(()=>document.querySelectorAll('h1').length===1&&document.title.startsWith('Matcha zubereiten')&&document.querySelector('link[rel="canonical"]').href==='https://stil-daheim.de/matcha.html'),'Titel, eine h1, kanonische Adresse');
await c.close();
// Verweise von anderen Seiten
[c,p]=await neu({viewport:{width:1440,height:900}});
await p.goto(B+'/kaffee.html',{waitUntil:'domcontentloaded'});
ok(await p.evaluate(()=>!!document.querySelector('.kf-wege a[href="matcha.html"]')&&!!document.querySelector('#fragen a[href="matcha.html"]')),'Kaffee-Ratgeber verweist auf den Matcha-Ratgeber');
await p.goto(B+'/wohnideen.html',{waitUntil:'domcontentloaded'});
ok(await p.evaluate(()=>{const s=document.getElementById('raum-matcha');return !!s&&!!s.querySelector('a[href^="matcha.html"]')}),'Wohnideen: Matcha-Raum führt zum Matcha-Ratgeber');
await p.goto(B+'/sitemap.xml');ok((await p.content()).includes('https://stil-daheim.de/matcha.html'),'Seite steht in der Sitemap');
await c.close();
// Handy
[c,p]=await neu({...devices['iPhone 13']});await p.goto(B+'/matcha.html',{waitUntil:'networkidle'});await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Handy: kein seitliches Scrollen');
ok(await p.evaluate(()=>{const h=document.querySelector('.mt-hero h1').getBoundingClientRect(),f=document.querySelector('.mt-hero picture').getBoundingClientRect();return h.top>f.top+f.height*.5}),'Handy: Bild oben, Überschrift darunter');
ok(await p.evaluate(()=>[...document.querySelectorAll('.mt-k li')].every((l,i,A)=>i===0||l.getBoundingClientRect().top>A[i-1].getBoundingClientRect().top)),'Handy: Herstellung untereinander');
ok(await p.evaluate(()=>[...document.querySelectorAll('#einkauf a.item,.btn,select')].every(e=>{const r=e.getBoundingClientRect();return r.height>=40})),'Handy: Tippflächen mindestens 40 px hoch');
await c.close();
[c,p]=await neu({viewport:{width:1280,height:800},reducedMotion:'reduce'});await p.goto(B+'/matcha.html',{waitUntil:'networkidle'});await p.waitForTimeout(600);
ok(await p.evaluate(()=>{const v=document.getElementById('mt-film');return v.paused&&!v.currentSrc}),'„Bewegung reduzieren“: nur das Standbild');
await c.close();
ok(errs.length===0,'Keine Skriptfehler'+(errs.length?': '+errs.join(' | '):''));
ok(fremd.length===0,'Keine Anfrage an fremde Server'+(fremd.length?': '+fremd.slice(0,3).join(', '):''));
await b.close();console.log(bad?('\n'+bad+' FEHLER'):'\nALLE TESTS BESTANDEN');process.exit(bad?1:0)})();
