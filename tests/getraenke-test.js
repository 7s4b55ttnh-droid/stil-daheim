// Prüft Kaffee-Rezepte (kaffee-rezepte.html), Tee-Ratgeber (tee.html) und den Kaffee-Abschnitt der Black-Friday-Seite.  node getraenke-test.js [Basis-URL]
const {chromium,devices}=require('playwright');const B=process.argv[2]||'http://localhost:8766';let bad=0;
const ok=(c,t)=>{console.log((c?'ok   ':'FEHLER ')+t);if(!c)bad++};
(async()=>{const b=await chromium.launch();const errs=[],fremd=[];
const neu=async(o)=>{const c=await b.newContext(o);const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
  p.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^data:|^blob:/.test(u)&&!/goatcounter/.test(u))fremd.push(u)});return [c,p]};
const amzOk=L=>L.every(l=>/sponsored/.test(l.r)&&/nofollow/.test(l.r)&&l.t==='_blank'&&l.an&&/amazon\.de\/s\?.*tag=stildaheim-21/.test(l.h));
const items=p=>p.$$eval('#einkauf a.item',A=>A.map(a=>({h:a.href,r:a.rel,t:a.target,an:/Anzeige/.test(a.textContent)})));
let [c,p]=await neu({viewport:{width:1440,height:900}});
// Kaffee-Rezepte
let r=await p.goto(B+'/kaffee-rezepte.html',{waitUntil:'networkidle'});ok(r.status()===200,'Kaffee-Rezepte: Seite lädt');
ok(await p.evaluate(()=>['cappuccino','flat-white','iced-latte','cold-brew'].every(i=>{const s=document.getElementById(i);return s&&s.querySelector('.rz-b svg[role="img"]')&&s.querySelectorAll('.rz-z b').length===3&&s.querySelectorAll('.steps>li').length>=3&&document.querySelector('.rz-nav a[href="#'+i+'"]')})),'Vier Rezepte, jedes mit Schnittbild, drei Mengen und Schritten');
ok(await p.$$eval('#cappuccino .rz-z b',L=>L.map(x=>x.textContent.replace(/\s/g,' ')).join('|')==='25 ml|100 ml|150–160 ml')&&await p.$$eval('#cold-brew .rz-z b',L=>L.map(x=>x.textContent.replace(/\s/g,' ')).join('|')==='100 g|1 l|6–24 h'),'Mengen für Cappuccino und Cold Brew wie in den Quellen');
const cb=()=>p.evaluate(()=>['cb-k','cb-w','cb-n'].map(i=>document.getElementById(i).textContent));
let o=await cb();ok(o.join('|')==='100 g|1 l|4 Gläser','Cold-Brew-Rechner Start: '+o.join(', '));
await p.selectOption('#cb-l','0.35');await p.selectOption('#cb-g','250');o=await cb();ok(o.join('|')==='35 g|0,35 l|1 Glas','Cold-Brew-Rechner 0,35 l: '+o.join(', '));
await p.selectOption('#cb-l','2');await p.selectOption('#cb-g','150');o=await cb();ok(o.join('|')==='200 g|2 l|10 Gläser','Cold-Brew-Rechner 2 l: '+o.join(', '));
let L=await items(p);ok(L.length===6&&amzOk(L),'Sechs Einkaufslinks als Anzeige mit Partner-Kennung');
ok(await p.$$eval('#quellen li',A=>A.length>=4)&&await p.evaluate(()=>!/Testsieger|entgiftet|heilt/i.test(document.querySelector('main').textContent)),'Quellen genannt, keine Heilversprechen');
ok(await p.evaluate(()=>document.querySelectorAll('h1').length===1&&document.querySelector('link[rel="canonical"]').href==='https://stil-daheim.de/kaffee-rezepte.html'&&/FAQPage/.test([...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent).join(' '))),'Eine h1, kanonische Adresse, strukturierte Daten');
// Tee
r=await p.goto(B+'/tee.html',{waitUntil:'networkidle'});ok(r.status()===200,'Tee: Seite lädt');
ok(await p.$$eval('.te-s',A=>A.length===4&&A.every(a=>a.querySelector('.te-sk[role="img"]')&&a.querySelector('.te-go')))&&await p.$$eval('.te-s dd',D=>D.map(d=>d.textContent.replace(/\s/g,' ')).join('|')==='kochend|2 bis 5 min|70 bis 90 °C|1 bis 3 min|sprudelnd kochend|mindestens 5 min|sprudelnd kochend|5 bis 10 min'),'Vier Sorten mit Temperatur und Ziehzeit wie in den Quellen');
ok(await p.evaluate(()=>{const s=document.querySelector('#gruen .te-sk span'),r=s.parentElement.getBoundingClientRect(),q=s.getBoundingClientRect();return Math.abs((q.left-r.left)/r.width-.25)<.02&&Math.abs(q.width/r.width-.5)<.02}),'Skala grüner Tee: 70 bis 90 Grad markiert');
await p.click('#gruen .te-go');await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.getElementById('tt-z').textContent==='2:00'&&document.getElementById('tt-n').textContent==='Grüner Tee'),'Timer übernimmt die Sorte (2:00, Grüner Tee)');
await p.click('#tt-p');ok(await p.evaluate(()=>document.getElementById('tt-z').textContent==='3:00'),'Plus stellt eine Minute mehr ein');
await p.click('#tt-m');await p.click('#tt-m');ok(await p.evaluate(()=>document.getElementById('tt-z').textContent==='1:00'),'Minus stellt auf 1:00');
await p.clock?.install?.().catch(()=>{});
await p.click('#tt-go');await p.waitForTimeout(2300);
ok(await p.evaluate(()=>{const t=document.getElementById('tt-z').textContent;return /^0:5[6-9]$/.test(t)&&document.getElementById('tt-go').textContent==='Stoppen'&&+document.getElementById('tt-fg').getAttribute('stroke-dashoffset')>5}),'Timer läuft herunter, Ring bewegt sich');
await p.click('#tt-go');ok(await p.evaluate(()=>document.getElementById('tt-z').textContent==='1:00'&&document.getElementById('tt-go').textContent==='Starten'),'Stoppen setzt zurück');
await p.evaluate(()=>{const R=Date.now;Date.now=()=>R()+61000});await p.click('#tt-go');await p.evaluate(()=>{const R=Date.now;Date.now=()=>R()+61000});await p.waitForTimeout(700);
ok(await p.evaluate(()=>/Fertig/.test(document.getElementById('tt-st').textContent)&&document.getElementById('tt-z').textContent==='0:00'),'Nach Ablauf: „Fertig“');
L=await items(p);ok(L.length===6&&amzOk(L),'Tee: sechs Einkaufslinks als Anzeige mit Partner-Kennung');
ok(await p.$$eval('#quellen li',A=>A.length>=4)&&await p.evaluate(()=>!/Testsieger|entgiftet|heilt|Superfood/i.test(document.querySelector('main').textContent)&&!/localStorage|sessionStorage|cookie/i.test([...document.querySelectorAll('main ~ script, body script:not([src])')].map(s=>s.textContent).filter(t=>/Tee-Timer/.test(t)).join(''))),'Tee: Quellen genannt, keine Heilversprechen, Timer speichert nichts');
ok(await p.evaluate(()=>document.querySelectorAll('h1').length===1&&document.querySelector('link[rel="canonical"]').href==='https://stil-daheim.de/tee.html'),'Tee: eine h1, kanonische Adresse');
// Black Friday
await p.goto(B+'/black-friday.html',{waitUntil:'networkidle'});
ok(await p.evaluate(()=>{const A=[...document.querySelectorAll('#kaffee .bfk')];return A.length===6&&A.slice(0,5).every(a=>{const l=a.querySelector('.go a');return /awin1\.com/.test(l.href)&&/otto\.de/.test(decodeURIComponent(l.href))&&/sponsored/.test(l.rel)&&a.querySelector('.tag')&&/^kaffee\.html#m-/.test(a.querySelector('.bfk-m').getAttribute('href'))&&/€/.test(a.querySelector('.bfk-p').textContent)})&&/amazon\.de/.test(A[5].querySelector('.go a').href)}),'Black Friday: fünf Maschinen (OTTO über Awin, Anzeige, Preis mit Stand) und Matcha-Set');
const ziele=await p.$$eval('#kaffee .bfk-m',A=>A.map(a=>a.getAttribute('href').split('#')[1]));
await p.goto(B+'/kaffee.html',{waitUntil:'domcontentloaded'});
ok(await p.evaluate(Z=>Z.every(z=>!!document.getElementById(z)),ziele.filter(Boolean))&&await p.evaluate(()=>!!document.querySelector('a[href="kaffee-rezepte.html"]')),'Sprungziele im Kaffee-Ratgeber vorhanden, Rezepte dort verlinkt');
await p.goto(B+'/sitemap.xml');const sm=await p.content();ok(sm.includes('/kaffee-rezepte.html')&&sm.includes('/tee.html'),'Beide Seiten in der Sitemap');
await c.close();
for(const pg of ['kaffee-rezepte.html','tee.html','black-friday.html']){[c,p]=await neu({...devices['iPhone 13']});await p.goto(B+'/'+pg,{waitUntil:'networkidle'});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Handy '+pg+': kein seitliches Scrollen');
  ok(await p.evaluate(()=>[...document.querySelectorAll('#einkauf a.item,.btn,select,.te-go,.te-b button,.bfk .go a,.rz-nav a')].every(e=>e.getBoundingClientRect().height>=40)),'Handy '+pg+': Tippflächen mindestens 40 px');await c.close();}
ok(errs.length===0,'Keine Skriptfehler'+(errs.length?': '+errs.join(' | '):''));
ok(fremd.length===0,'Keine Anfrage an fremde Server'+(fremd.length?': '+fremd.slice(0,3).join(', '):''));
await b.close();console.log(bad?('\n'+bad+' FEHLER'):'\nALLE TESTS BESTANDEN');process.exit(bad?1:0)})();
