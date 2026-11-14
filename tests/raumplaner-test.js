/* Bedientest des Raumplaners mit Playwright: Handy mit Touch, Desktop mit Maus und Tastatur.
   Vorher bauen und die Ausgabe ausliefern:  python3 build.py && (cd ../stil-daheim && python3 -m http.server 8766)
   Aufruf:  node tests/raumplaner-test.js [Basisadresse]   Standard: http://localhost:8766, für die echte Seite: https://stil-daheim.de */
const {chromium,devices}=require('playwright');
const U=(process.argv[2]||'http://localhost:8766')+'/raumplaner.html';
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FEHLER:',m)}else console.log('ok',m)};
(async()=>{const b=await chromium.launch();
/* ---------- Handy mit Touch ---------- */
let c=await b.newContext({...devices['iPhone 13'],deviceScaleFactor:1});let p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(U);await p.waitForTimeout(900);
const st=()=>p.evaluate(()=>{const S=RP.state();return JSON.parse(JSON.stringify(S))});
const T=id=>p.evaluate(i=>document.getElementById(i).textContent,id);
const center=async sel=>{await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center',behavior:'instant'}),sel);await p.waitForTimeout(350)};
let s0=await st();
ok(s0.items.length>=5&&s0.type==='wohnen','Start: Wohnzimmer mit Vorschlag ('+s0.items.length+' Möbel)');
ok((await T('rp-sum')).includes('Alles passt'),'Start: Raum-Check ohne Mängel: '+await T('rp-sum'));
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'kein Querscrollen');
ok(await p.evaluate(()=>{const a=document.querySelector('.rp-b'),b2=document.querySelector('.rp-a');return a.getBoundingClientRect().top<b2.getBoundingClientRect().top}),'Handy: Plan steht vor den Raummaßen');
// Sofa mit dem Finger ziehen
const sofa=s0.items.find(i=>i.t==='sofa3'||i.t==='sofa2');
await center('#rp-plan');
const boxOf=async id=>p.evaluate(id=>{const r=document.querySelector('.rp-it[data-id="'+id+'"] .rp-hit').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}},id);
let bx=await boxOf(sofa.id);
const cdp=await c.newCDPSession(p);
async function touchDrag(x1,y1,x2,y2,steps=8){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/steps,y:y1+(y2-y1)*i/steps}]});await p.waitForTimeout(25)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(300)}
const sy0=await p.evaluate(()=>scrollY);
await touchDrag(bx.x+bx.w/2,bx.y+bx.h/2,bx.x+bx.w/2-60,bx.y+bx.h/2-30);
let s1=await st(),sofa1=s1.items.find(i=>i.id===sofa.id);
ok(sofa1.x<sofa.x-30&&sofa1.y<sofa.y-10,'Sofa mit dem Finger verschoben: '+sofa.x+','+sofa.y+' → '+sofa1.x+','+sofa1.y);
ok(Math.abs(await p.evaluate(()=>scrollY)-sy0)<3,'Seite scrollt beim Ziehen nicht mit');
ok(await p.evaluate(()=>!document.getElementById('rp-undo').disabled),'Rückgängig ist aktiv');
ok(await p.evaluate(()=>document.querySelector('#rp-tool .rp-tl-h b').textContent.includes('Sofa')),'Auswahl zeigt das Sofa');
ok(await p.evaluate(()=>document.querySelectorAll('.rp-dim.gap').length>=2),'Abstände zur Umgebung werden gezeigt');
// Drehen, Größe, Doppeln, Entfernen
await p.click('#rp-tool button[data-a="rot"]');await p.waitForTimeout(200);
ok((await st()).items.find(i=>i.id===sofa.id).r===(sofa.r+1)%4,'Drehen');
await p.fill('#rp-iw','250');await p.press('#rp-iw','Enter');await p.waitForTimeout(250);
ok((await st()).items.find(i=>i.id===sofa.id).w===250,'Breite auf 250 cm gesetzt');
const n0=(await st()).items.length;
await p.click('#rp-tool button[data-a="dup"]');await p.waitForTimeout(400);
ok((await st()).items.length===n0+1,'Doppeln');
await p.click('#rp-tool button[data-a="del"]');await p.waitForTimeout(300);
ok((await st()).items.length===n0,'Entfernen');
// Rückgängig bis zum Anfang
for(let i=0;i<8;i++){if(await p.evaluate(()=>document.getElementById('rp-undo').disabled))break;await p.click('#rp-undo');await p.waitForTimeout(150)}
let sb=await st();ok(JSON.stringify(sb.items.map(i=>[i.t,i.x,i.y,i.w,i.r]))===JSON.stringify(s0.items.map(i=>[i.t,i.x,i.y,i.w,i.r])),'Rückgängig stellt den Anfang wieder her');
// Möbel hinzufügen
await center('#rp-tabs');
await p.click('#rp-tabs button[data-g="3"]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>!!document.querySelector('#rp-cat button[data-t="bett180"]')),'Gruppe Schlafen zeigt Betten');
await p.click('#rp-cat button[data-t="nacht"]');await p.waitForTimeout(700);
let s2=await st();ok(s2.items.some(i=>i.t==='nacht'),'Nachttisch hinzugefügt');
ok(await p.evaluate(()=>{const r=document.getElementById('rp-plan').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+80}),'Plan ist nach dem Hinzufügen im Blick');
// Überlappung erzeugt Mangel
await p.evaluate(()=>{const S=RP.state(),n=S.items.find(i=>i.t==='nacht'),t=S.items.find(i=>i.t==='couch');n.x=t.x+5;n.y=t.y+5});
await p.click('#rp-tool button[data-n="5,0"]');await p.waitForTimeout(600);
ok((await T('rp-checks')).includes('ineinander'),'Überlappung wird gemeldet');
ok(await p.evaluate(()=>document.querySelectorAll('.rp-it.bad').length===2),'beide Möbel sind markiert');
// Raumart wechseln
await center('#rp-type');
await p.click('#rp-type button[data-t="schlafen"]');await p.waitForTimeout(700);
let s3=await st();ok(s3.type==='schlafen'&&s3.items.some(i=>i.t.startsWith('bett')),'Schlafzimmer-Vorschlag mit Bett');
ok((await T('rp-tb-n'))==='Schlafzimmer','Schriftfeld nennt die Raumart');
// Raummaße: Meter-Eingabe
await p.fill('#rp-w','5,2');await p.press('#rp-w','Enter');await p.waitForTimeout(700);
let s4=await st();ok(s4.w===520,'Eingabe 5,2 wird als 520 cm verstanden');
ok(s4.items.every(i=>i.x>=0&&i.y>=0&&i.x+(i.r%2?i.h:i.w)<=s4.w&&i.y+(i.r%2?i.w:i.h)<=s4.d),'alle Möbel liegen im Raum');
ok((await T('rp-tb-m')).includes('5,20'),'Schriftfeld zeigt 5,20 m');
// Tür ziehen: an eine andere Wand
await center('#rp-plan');
const dr=await p.evaluate(()=>{const r=document.querySelector('.rp-door .rp-hit').getBoundingClientRect(),h=document.querySelector('.rp-svg').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,hx:h.x,hy:h.y,hw:h.width,hh:h.height}});
const d0=(await st()).doors[0];
await touchDrag(dr.x,dr.y,dr.hx+dr.hw-12,dr.hy+dr.hh*0.45,12);
const d1=(await st()).doors[0];
ok(d1.wall==='E','Tür an die rechte Wand gezogen: '+d0.wall+' → '+d1.wall+' @'+d1.pos);
ok((await st()).items.some(i=>i.t.startsWith('bett')),'Vorschlag passt sich der Tür an');
// Tür-Werkzeug
await p.evaluate(()=>{const e=document.querySelector('.rp-door .rp-hit');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,clientX:e.getBoundingClientRect().x+5,clientY:e.getBoundingClientRect().y+5,button:0}));window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7}))});await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.querySelector('#rp-tool .rp-tl-h b').textContent==='Tür'),'Tür ausgewählt');
await p.click('#rp-tool button[data-a="inw"]');await p.waitForTimeout(300);
ok((await st()).doors[0].inw===0,'Tür öffnet nach außen');
// + Fenster
const w0=(await st()).wins.length;await p.click('#rp-addwin');await p.waitForTimeout(400);
ok((await st()).wins.length===w0+1,'Fenster hinzugefügt');
// Gespeichert und Link
const encd=await p.evaluate(()=>RP.enc());
await p.reload();await p.waitForTimeout(800);
ok(await p.evaluate(()=>RP.enc())===encd,'Plan bleibt nach dem Neuladen erhalten');
await p.evaluate(()=>localStorage.clear());
await p.goto(U+'?p='+encodeURIComponent(encd)+'#planer');await p.waitForTimeout(800);
ok(await p.evaluate(()=>RP.enc())===encd,'geteilter Link stellt den Plan her');
ok(encodeURIComponent(encd)===encd,'Link braucht keine Sonderzeichen');
// Raum-Check antippen zeigt Maß
await p.goto(U);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(900);
await center('#rp-checks');
await p.click('#rp-checks button[data-k^="tbl"]');await p.waitForTimeout(700);
ok(await p.evaluate(()=>[...document.querySelectorAll('.rp-dim text')].some(t=>t.textContent==='45 cm')),'Antippen im Raum-Check zeigt das Maß 45 cm im Plan');
// Maßliste
ok(await p.evaluate(()=>document.querySelectorAll('#rp-list a.item').length>=2&&[...document.querySelectorAll('#rp-list a.item')].every(a=>a.href.includes('tag=stildaheim-21')&&a.rel.includes('sponsored')&&a.textContent.includes('Anzeige'))),'Maßliste mit gekennzeichneten Partnerlinks');
ok(errs.length===0,'keine Skriptfehler am Handy: '+errs.join(' | '));
await c.close();
/* ---------- Desktop: Maus und Tastatur ---------- */
c=await b.newContext({viewport:{width:1366,height:820}});p=await c.newPage();const e2=[];p.on('pageerror',e=>e2.push(e.message));
await p.goto(U);await p.waitForTimeout(900);
await p.evaluate(()=>document.getElementById('rp-plan').scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(400);
const S0=await p.evaluate(()=>JSON.parse(JSON.stringify(RP.state())));
const tb=S0.items.find(i=>i.t==='couch');
const r=await p.evaluate(id=>{const q=document.querySelector('.rp-it[data-id="'+id+'"] .rp-hit').getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2}},tb.id);
await p.mouse.move(r.x,r.y);await p.mouse.down();await p.mouse.move(r.x+40,r.y+20,{steps:6});await p.mouse.move(r.x+80,r.y+50,{steps:6});await p.mouse.up();await p.waitForTimeout(300);
let S1=await p.evaluate(()=>JSON.parse(JSON.stringify(RP.state()))),t1=S1.items.find(i=>i.id===tb.id);
ok(t1.x>tb.x+20&&t1.y>tb.y+10,'Couchtisch mit der Maus verschoben');
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.classList.contains('rp-it')),'gezogenes Möbel hat den Fokus');
await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');await p.waitForTimeout(500);
ok((await p.evaluate(id=>RP.state().items.find(i=>i.id===id).x,tb.id))===t1.x-10,'Pfeiltaste verschiebt um 5 cm');
await p.keyboard.press('r');await p.waitForTimeout(200);
ok((await p.evaluate(id=>RP.state().items.find(i=>i.id===id).r,tb.id))===(tb.r+1)%4,'Taste R dreht');
const nn=await p.evaluate(()=>RP.state().items.length);
await p.keyboard.press('Delete');await p.waitForTimeout(300);
ok((await p.evaluate(()=>RP.state().items.length))===nn-1,'Entf entfernt');
ok(await p.evaluate(()=>{const a=document.querySelector('.rp-b').getBoundingClientRect(),b2=document.querySelector('.rp-a').getBoundingClientRect();return a.left<b2.left&&Math.abs(a.top-b2.top)<200}),'Desktop: Plan links, Schritte rechts');
ok(await p.evaluate(()=>{const b2=document.querySelector('.rp-b').getBoundingClientRect();return b2.height<innerHeight-70}),'Desktop: Plan und Auswahl passen in den Bildschirm ('+await p.evaluate(()=>Math.round(document.querySelector('.rp-b').getBoundingClientRect().height))+' px)');
ok(e2.length===0,'keine Skriptfehler am Desktop: '+e2.join(' | '));
await c.close();
console.log(fails?fails+' FEHLER':'ALLE TESTS BESTANDEN');await b.close();process.exit(fails?1:0)})()
