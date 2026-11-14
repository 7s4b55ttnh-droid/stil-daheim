/* Prüft den Rechenkern des Raumplaners ohne Browser: 2.000 Zufallsräume je Raumart.
   Aufruf im Ordner mit raumplaner.js:  node tests/raumplaner-kern.js [Startzahl]
   Harte Bedingungen (führen zum Abbruch): jedes Möbel liegt im Raum, nichts steht ineinander, keine Tür ist blockiert,
   der Plan übersteht die Rundreise durch den Link, der fest eingetragene Startplan stimmt mit dem Vorschlag überein.
   Zur Einordnung: „mit bad“ muss 0 sein, „mit warn“ bleibt im Schlafzimmer bei wenigen Prozent (sehr kleine Zimmer). */
const path=require('path');const RP=require(path.join(__dirname,'..','raumplaner.js'));
let seed=+process.argv[2]||7;function rnd(){seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}
function ri(a,b){return Math.round((a+rnd()*(b-a))/5)*5}
const walls=['N','E','S','W'];
function room(type){const big={wohnen:[300,700],schlafen:[260,560],essen:[280,600],arbeiten:[220,500],flur:[120,220]}[type];
  const st={w:ri(big[0],big[1]),d:type==='flur'?ri(250,600):ri(big[0],big[1]),type,doors:[],wins:[],items:[]};
  const len=w=>w==='N'||w==='S'?st.w:st.d;
  const dw=walls[Math.floor(rnd()*4)],ds=[80,90,90,100][Math.floor(rnd()*4)];st.doors.push({wall:dw,pos:ri(0,len(dw)-ds),size:ds,hinge:rnd()<.5?1:0,inw:rnd()<.85?1:0});
  if(rnd()<.15){const w2=walls[Math.floor(rnd()*4)];if(w2!==dw)st.doors.push({wall:w2,pos:ri(0,len(w2)-90),size:90,hinge:0,inw:1})}
  const nw=type==='flur'?(rnd()<.3?1:0):1+Math.floor(rnd()*2);
  for(let i=0;i<nw;i++){const ww=walls[Math.floor(rnd()*4)],s=Math.min(ri(80,220),len(ww)-20);if(ww===dw&&rnd()<.7)continue;st.wins.push({wall:ww,pos:ri(0,len(ww)-s),size:s})}
  return st}
const stat={};let tmax=0,tsum=0,tn=0,fails=0;
for(const type of ['wohnen','schlafen','essen','arbeiten','flur']){
  const s={n:0,empty:0,bad:0,warn:0,items:0,kinds:{},warnKinds:{}};stat[type]=s;
  for(let k=0;k<400;k++){const st=room(type);RP.use(st);RP.preset(type);s.n++;
    if(!st.items.length){s.empty++;continue}
    s.items+=st.items.length;st.items.forEach(i=>s.kinds[i.t]=(s.kinds[i.t]||0)+1);
    // harte Bedingungen
    for(const i of st.items){if(!RP.inside(i)){fails++;console.log('AUSSERHALB',type,JSON.stringify(st))}
      if(!RP.CAT[i.t].flat&&RP.blocksDoor(i)){fails++;console.log('TUER',type,RP.enc())}}
    const sol=st.items.filter(i=>!RP.CAT[i.t].flat);
    for(let a=0;a<sol.length;a++)for(let b=a+1;b<sol.length;b++)if(RP.overlap(sol[a],sol[b])){fails++;console.log('UEBERLAPPT',type,sol[a].t,sol[b].t,RP.enc())}
    const t0=process.hrtime.bigint();const ck=RP.check();const dt=Number(process.hrtime.bigint()-t0)/1e6;tmax=Math.max(tmax,dt);tsum+=dt;tn++;
    const bad=ck.filter(c=>c.st==='bad'),warn=ck.filter(c=>c.st==='warn');
    if(bad.length){s.bad++;if(s.bad<=3)console.log('BAD',type,bad.map(b=>b.t+': '+b.x).join(' | '),'\n   ',RP.enc())}
    if(warn.length){s.warn++;warn.forEach(w=>{const key=w.t;s.warnKinds[key]=(s.warnKinds[key]||0)+1})}
    // Link-Rundreise
    const e=RP.enc(),d2=RP.dec(e);RP.use(d2);if(RP.enc()!==e){fails++;console.log('RUNDREISE',e,'\n',RP.enc())}
  }}
for(const t in stat){const s=stat[t];console.log(t,'Räume',s.n,'leer',s.empty,'mit bad',s.bad,'mit warn',s.warn,'Möbel im Schnitt',(s.items/(s.n-s.empty)).toFixed(1),JSON.stringify(s.kinds),JSON.stringify(s.warnKinds))}
RP.use(RP.def());RP.preset('wohnen');if(RP.enc()!==RP.START){fails++;console.log('STARTPLAN weicht ab. In raumplaner.js bei START eintragen:\n'+RP.enc())}
const bads=Object.values(stat).reduce((a,s)=>a+s.bad,0);
console.log('check(): Mittel',(tsum/tn).toFixed(1),'ms, max',tmax.toFixed(1),'ms | harte Fehler',fails,'| Räume mit bad',bads);
process.exit(fails||bads?1:0);
