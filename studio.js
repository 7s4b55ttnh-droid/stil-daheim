/* Stil-Daheim Wandfarben-Studio.
   Ein Werkzeug für die Seite wandfarbe-testen.html (voll) und die Startseite (kurz): <div class="st" data-studio="voll|kurz"></div>
   - Beispielräume: Foto + genaue Masken aus assets/ (wf-<slug>.jpg, -maske.png, teils -sitz.png und -boden.png). Die Wand wird mit mix-blend-mode:multiply eingefärbt,
     beim Wechsel wischt die neue Farbe über die Wand. Sofa und Boden: Farbton (color) + Helligkeit (multiply).
   - Eigenes Foto (nur voll): bleibt im Browser. Die Wand wird an Kanten und Farbton erkannt und gleich eingefärbt; ein Tipp ins Bild nimmt eine Fläche dazu.
   - Gemerkt wird nur im Browser (localStorage "sdst"): letzter Raum, letzte Farbe, Lieblingsfarben.
   Daten: assets/studio.json (schreibt wandfarben.py). Keine fremden Dienste. */
(function(){
'use strict';
var PAL=[['Warmweiß','#F2ECE0'],['Greige','#CFC6B8'],['Sand','#D9C7A8'],['Salbeigrün','#A8B5A0'],['Olivgrün','#7C8060'],['Tannengrün','#3F5548'],['Graublau','#8A9BA8'],['Petrol','#2F5D62'],['Nachtblau','#2F3E55'],['Altrosa','#D4B2A7'],['Terrakotta','#C27B5A'],['Ocker','#D2A55A']];
var SITZ=[['Original',''],['Grau','#8F8F8C'],['Beige','#D8C7AE'],['Grün','#5E7A64'],['Blau','#3E5C7E'],['Cognac','#A9683A'],['Anthrazit','#4A4D52']];
var BODEN=[['Original',''],['Helles Holz','#C9A77C'],['Dunkles Holz','#5A3D2B'],['Grau','#9A9A98'],['Rötlich','#A8623A']];
var I={herz:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>',
 foto:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
 mond:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/></svg>',
 wuerfel:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r=".9"/><circle cx="15" cy="15" r=".9"/><circle cx="15" cy="9" r=".9"/><circle cx="9" cy="15" r=".9"/></svg>',
 teilen:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4l4 4M6 12v7h12v-7"/></svg>',
 halb:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 12h16M7 15.5h10M7 18h10" /></svg>',
 laden:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"/></svg>'};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function merk(){try{return JSON.parse(localStorage.getItem('sdst'))||{}}catch(e){return {}}}
function schreib(o){try{localStorage.setItem('sdst',JSON.stringify(o))}catch(e){}}
/* Umfärben von Sofa und Boden: Der Farbton kommt über mix-blend-mode:color. Die Helligkeit wird davor angepasst, abhängig davon, wie hell das Möbel im Foto ist (hs und hb aus studio.json):
   dunkler über multiply mit Grau, heller über screen mit Grau. So wird auch aus einem dunkelgrünen Sofa ein beiges. Rückgabe: [Farbton, Grau für multiply, Grau für screen]. */
function ton(hex,hb){if(!hex)return ['transparent','#fff','#000'];var c=rgb(hex),lt=(c[0]*.3+c[1]*.59+c[2]*.11)/255*.9,g=function(v){v=Math.round(Math.max(0,Math.min(1,v))*255);return 'rgb('+v+','+v+','+v+')'};
 hb=hb||.5;return lt<=hb?[hex,g(lt/hb),'#000']:[hex,'#fff',g(1-(1-lt)/(1-hb))]}
/* RAL Classic: Bildschirmwerte nach der Liste der RAL-Farben (Wikipedia). Nur zur Orientierung, im Laden zählt die Farbkarte. */
var RAL=[[1000,'Grünbeige','CDBA88'],[1001,'Beige','D0B084'],[1002,'Sandgelb','D2AA6D'],[1011,'Braunbeige','AF804F'],[1013,'Perlweiß','E3D9C6'],[1014,'Elfenbein','DDC49A'],[1015,'Hellelfenbein','E6D2B5'],[1019,'Graubeige','A48F7A'],[1024,'Ockergelb','BA8F4C'],[1034,'Pastellgelb','EB9C52'],
[2001,'Rotorange','BE4E20'],[2010,'Signalorange','D4652F'],[2012,'Lachsorange','DB6A50'],[3009,'Oxidrot','703731'],[3012,'Beigerot','CB8D73'],[3014,'Altrosa','D47479'],[3015,'Hellrosa','E1A6AD'],[3016,'Korallenrot','AC4034'],[4009,'Pastellviolett','A38995'],
[5001,'Grünblau','1F4764'],[5003,'Saphirblau','2A3756'],[5009,'Azurblau','2E5978'],[5013,'Kobaltblau','232D53'],[5014,'Taubenblau','6C7C98'],[5020,'Ozeanblau','0B4151'],[5021,'Wasserblau','07737A'],[5023,'Fernblau','4D668E'],[5024,'Pastellblau','6A93B0'],
[6003,'Olivgrün','4B573E'],[6004,'Blaugrün','0E4243'],[6005,'Moosgrün','0F4336'],[6009,'Tannengrün','26392F'],[6011,'Resedagrün','68825B'],[6013,'Schilfgrün','797C5A'],[6019,'Weißgrün','B7D9B1'],[6021,'Blassgrün','86A47C'],[6028,'Kieferngrün','2D5546'],[6033,'Minttürkis','478A84'],[6034,'Pastelltürkis','7FB0B2'],
[7006,'Beigegrau','756F61'],[7030,'Steingrau','939388'],[7032,'Kieselgrau','B9B9A8'],[7035,'Lichtgrau','CBD0CC'],[7036,'Platingrau','9A9697'],[7037,'Staubgrau','7C7F7E'],[7038,'Achatgrau','B4B8B0'],[7044,'Seidengrau','BDBDB2'],[7047,'Telegrau 4','CFD0CF'],
[8001,'Ockerbraun','9C6B30'],[8004,'Kupferbraun','8F4E35'],[8023,'Orangebraun','A65E2F'],[8025,'Blassbraun','755C49'],[9001,'Cremeweiß','EFEBDC'],[9002,'Grauweiß','DDDED4'],[9003,'Signalweiß','F4F8F4'],[9010,'Reinweiß','F7F9EF'],[9016,'Verkehrsweiß','F7FBF5'],[9018,'Papyrusweiß','CFD3CD']];
function lab(h){var c=rgb(h).map(function(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}),x=(c[0]*.4124+c[1]*.3576+c[2]*.1805)/.95047,y=c[0]*.2126+c[1]*.7152+c[2]*.0722,z=(c[0]*.0193+c[1]*.1192+c[2]*.9505)/1.08883,f=function(t){return t>.008856?Math.pow(t,1/3):7.787*t+16/116};
 return [116*f(y)-16,500*(f(x)-f(y)),200*(f(y)-f(z))]}
function ral(hex){var a=lab(hex),best=null,bd=1e9;RAL.forEach(function(r){var b=lab('#'+r[2]),d=Math.sqrt(Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2)+Math.pow(a[2]-b[2],2));if(d<bd){bd=d;best=r}});return {nr:best[0],name:best[1],hex:'#'+best[2],d:bd}}
function hx(s){return /^[0-9a-fA-F]{6}$/.test(s||'')?'#'+s.toUpperCase():''}
var EXT='<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
function rgb(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}

function start(el,R){
 var voll=el.dataset.studio!=='kurz',M=merk(),favs=(M.f||[]).filter(function(f){return f&&f[1]}),raum=null,art='raum',farbe=null,sf={},eve=false,halb=false,mix=[],P={};
 if(voll)location.search.replace(/[?&]([a-z]+)=([^&]*)/g,function(_,k,v){try{P[k]=decodeURIComponent(v)}catch(e){}});
 if(P.mix)P.mix.split(',').slice(0,6).forEach(function(t){var h=hx(t.slice(0,6));if(h)mix.push([(t.slice(7)||'Deine Farbe').slice(0,24),h])});
 var by={};R.forEach(function(r){by[r.slug]=r});
 el.innerHTML='<div class="st-ph" data-art="raum"><img alt="" decoding="async"><div class="st-lay" aria-hidden="true"><i class="a"></i><i class="n"></i></div>'+
  '<div class="st-d st-boden"></div><div class="st-s st-boden"></div><div class="st-k st-boden"></div><div class="st-d st-sitz"></div><div class="st-s st-sitz"></div><div class="st-k st-sitz"></div><div class="st-eve" aria-hidden="true"></div>'+
  (voll?'<canvas width="16" height="9" role="img" aria-label="Dein Foto. Tippe auf die Wand, wenn ein Stück fehlt."></canvas>':'')+'<span class="st-ki">Mit KI erstellt</span></div>'+
  '<p class="st-cap"><b></b><span></span><button type="button" class="st-herz" aria-pressed="false" aria-label="Farbe als Liebling merken">'+I.herz+'</button></p>'+
  '<div class="st-dots" role="group" aria-label="Wandfarbe wählen"></div>'+
  '<p class="st-h">'+(voll?'Raum wechseln':'Anderer Raum')+' <small>Beispielräume, mit KI erstellt</small></p><div class="st-rooms"></div>'+
  (voll?'<div class="st-more"></div><details class="st-fein" hidden><summary>Feiner einstellen</summary><div><label>Genauigkeit <input type="range" min="8" max="60" value="26" aria-label="Wie streng die Wand erkannt wird"></label><button type="button" class="st-btn" data-a="zurueck">Letzten Tipp zurück</button><button type="button" class="st-btn" data-a="neu">Wand neu suchen</button></div></details>':'')+
  '<p class="st-msg" role="status"></p>'+(voll?'<details class="st-kauf"><summary>Diese Farbe kaufen</summary><div></div></details><p class="st-link"></p>':'<div class="st-los"><a class="btn" href="wandfarbe-testen.html">Im Studio weitermachen</a><a class="btn ghost" href="wandfarbe-testen.html#foto">Mit deinem Zimmer ausprobieren</a></div>');
 var ph=el.querySelector('.st-ph'),img=ph.querySelector('img'),lay=ph.querySelector('.st-lay'),neu=lay.querySelector('.n'),cap=el.querySelector('.st-cap'),dots=el.querySelector('.st-dots'),rooms=el.querySelector('.st-rooms'),
  more=el.querySelector('.st-more'),msg=el.querySelector('.st-msg'),herz=el.querySelector('.st-herz'),fein=el.querySelector('.st-fein'),link=el.querySelector('.st-link'),kaufBox=el.querySelector('.st-kauf div'),cv=ph.querySelector('canvas');
 function sag(t){msg.textContent=t||''}
 function sichern(){M.r=art==='raum'&&raum?raum.slug:M.r;M.c=farbe;M.f=favs.slice(0,8);schreib(M)}

 /* ---------- Farbpunkte ---------- */
 function liste(){var out=[],seen={};function add(f,typ){var k=f[1].toUpperCase();if(seen[k])return;seen[k]=1;out.push([f[0],f[1],typ])}
  mix.forEach(function(f){add(f,'stil')});favs.forEach(function(f){add(f,'fav')});if(art==='raum'&&raum)raum.farben.forEach(function(f){add(f,'raum')});PAL.forEach(function(f){add(f,'')});return out}
 function punkte(){var L=liste(),h='',letzt=null;L.forEach(function(f){if(letzt!==null&&letzt!==f[2]&&f[2]==='')h+='<span class="st-tr" aria-hidden="true"></span>';letzt=f[2];
   h+='<button type="button" aria-pressed="'+(farbe&&farbe[1].toUpperCase()===f[1].toUpperCase())+'" data-c="'+f[1]+'" data-n="'+esc(f[0])+'" data-t="'+f[2]+'" title="'+esc(f[0])+'" aria-label="'+esc(f[0])+(f[2]==='raum'?', passt zu diesem Raum':f[2]==='stil'?', aus deinem Stil':'')+'"><i style="background:'+f[1]+'"></i>'+(f[2]==='fav'?'<em>♥</em>':'')+'</button>'});
  dots.innerHTML=h}
 function titel(){var passt=art==='raum'&&raum&&raum.farben.some(function(f){return f[1].toUpperCase()===farbe[1].toUpperCase()});cap.querySelector('b').textContent=farbe[0];
  cap.querySelector('span').textContent=passt?'passt zu diesem Raum':mix.some(function(f){return f[1]===farbe[1].toUpperCase()})?'aus deinem Stil':'';kauf();var fav=favs.some(function(f){return f[1].toUpperCase()===farbe[1].toUpperCase()});herz.setAttribute('aria-pressed',fav?'true':'false');
  herz.setAttribute('aria-label',fav?'Liebling entfernen':'Farbe als Liebling merken')}
 function setzFarbe(f,wisch){farbe=[f[0],f[1]];titel();[].forEach.call(dots.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',b.dataset.c.toUpperCase()===f[1].toUpperCase()?'true':'false')});sichern();
  if(art==='foto'){if(F.taps.length)F.draw();return}
  clearTimeout(ph._t);if(neu.classList.contains('go')){ph.style.setProperty('--w',ph._c);neu.classList.remove('go')}
  ph._c=f[1];if(!wisch){ph.style.setProperty('--w',f[1]);return}
  ph.style.setProperty('--n',f[1]);void neu.offsetWidth;neu.classList.add('go');ph._t=setTimeout(function(){ph.style.setProperty('--w',f[1]);neu.classList.remove('go')},1150)}
/* ---------- Diese Farbe kaufen: nächster RAL-Ton, Menge, Einkaufsliste ---------- */
 var flaeche=25;
 function kauf(){if(!kaufBox||!farbe)return;var r=ral(farbe[1]),lit=Math.ceil(flaeche*2/6*2)/2,amz=function(q){return 'https://www.amazon.de/s?k='+encodeURIComponent(q).replace(/%20/g,'+')+'&tag=stildaheim-21'};
  var t=r.d<3?'Sehr nah dran. Halte im Laden trotzdem die Farbkarte daneben, Bildschirme zeigen Farben nie ganz genau.':r.d<7?'Ähnlich, aber nicht gleich. Nimm das gespeicherte Bild mit und vergleiche an der Farbkarte.':'Kein RAL-Ton trifft diese Farbe genau, das ist der nächste. Nimm das gespeicherte Bild mit und lass dir im Baumarkt einen Ton nach Farbkarte mischen.';
  var L=[['Wandfarbe '+farbe[0]+' matt','Wandfarbe in '+farbe[0]],['Farbroller Set mit Farbwanne','Farbroller mit Wanne'],['Malerkrepp','Malerkrepp zum Abkleben'],['Abdeckfolie Maler','Abdeckfolie für Boden und Möbel'],['RAL Farbfächer','RAL-Farbfächer zum Gegenhalten']];
  kaufBox.innerHTML='<div class="st-ral"><span><i style="background:'+farbe[1]+'"></i><small>Deine Wahl</small><b>'+esc(farbe[0])+'</b></span><span><i style="background:'+r.hex+'"></i><small>Nächster RAL-Ton</small><b>RAL '+r.nr+' '+r.name+'</b></span></div><p>'+t+'</p>'+
   '<label class="st-fl">Wandfläche <input type="range" min="5" max="80" step="1" value="'+flaeche+'" aria-label="Wandfläche in Quadratmetern"><output>'+flaeche+' m²</output></label>'+
   '<p class="st-lit">Für zwei Anstriche brauchst du etwa <b>'+String(lit).replace('.',',')+' Liter</b>, gerechnet mit 6 m² je Liter. Mit Türen und Fenstern rechnet der <a href="rechner.html">Raum-Rechner</a> genauer.</p>'+
   '<div class="starts"><p class="starts-h"><b>Was du zum Streichen brauchst</b><span class="tag">Anzeige</span></p><ul>'+L.map(function(x){return '<li><a href="'+amz(x[0])+'" rel="sponsored nofollow noopener" target="_blank"><span>'+esc(x[1])+'</span><em>Bei Amazon'+EXT+'</em></a></li>'}).join('')+'</ul></div>'}
 if(kaufBox)kaufBox.addEventListener('input',function(ev){if(ev.target.type!=='range')return;flaeche=+ev.target.value;var lit=Math.ceil(flaeche*2/6*2)/2;kaufBox.querySelector('output').textContent=flaeche+' m²';kaufBox.querySelector('.st-lit b').textContent=String(lit).replace('.',',')+' Liter'});
 dots.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;setzFarbe([b.dataset.n,b.dataset.c],true);sag('')});
 herz.addEventListener('click',function(){var i=-1;favs.forEach(function(f,k){if(f[1].toUpperCase()===farbe[1].toUpperCase())i=k});if(i>=0)favs.splice(i,1);else favs.unshift([farbe[0],farbe[1]]);punkte();titel();sichern();
  sag(i>=0?'':'Gemerkt. Deine Lieblingsfarben stehen ab jetzt vorn.')});

 /* ---------- Räume ---------- */
 function leiste(){var h=voll?'<label class="st-eig"><span class="b">'+I.foto+'</span><span class="t">Eigenes Foto</span><input type="file" accept="image/*"></label>':'';
  R.forEach(function(r){h+='<button type="button" aria-pressed="false" data-s="'+r.slug+'"><span class="b"><img src="assets/wf-'+r.slug+'-k.jpg" width="240" height="135" alt="" loading="lazy"></span><span class="t">'+esc(r.name)+'</span></button>'});
  if(!voll)h+='<a href="wandfarbe-testen.html"><span class="b st-alle" style="display:grid;place-items:center;border:1.5px solid var(--line);font-size:.9rem">Alle '+R.length+' Räume</span><span class="t">im Studio</span></a>';rooms.innerHTML=h}
 function mini(was,L,name){return '<div class="st-grp" data-was="'+was+'"><span>'+name+'</span><div class="st-mini" role="group" aria-label="'+name+' umfärben">'+L.map(function(f,i){return '<button type="button" class="'+(i?'':'o')+'" aria-pressed="'+(i===0)+'" data-k="'+f[1]+'" title="'+f[0]+'" aria-label="'+name+': '+f[0]+'"><i'+(f[1]?' style="background:'+f[1]+'"':'')+'></i></button>'}).join('')+'</div></div>'}
 function mehr(){if(!more)return;var h='';if(art==='raum'&&raum){if(raum.sitz)h+=mini('sitz',SITZ,raum.sitzname||'Sofa');if(raum.boden)h+=mini('boden',BODEN,'Boden')}
  if(art==='raum')h+='<button type="button" class="st-btn" data-a="halb" aria-pressed="'+halb+'">'+I.halb+'Halbhoch</button><button type="button" class="st-btn" data-a="abend" aria-pressed="'+eve+'">'+I.mond+'Abendlicht</button>';
  h+='<button type="button" class="st-btn" data-a="zufall">'+I.wuerfel+'Überrasch mich</button><button type="button" class="st-btn" data-a="speichern">'+I.laden+'Bild speichern</button>';
  if(art==='raum')h+='<button type="button" class="st-btn" data-a="teilen">'+I.teilen+'Link teilen</button>';more.innerHTML=h}
 function setzTon(w,hex){if(!raum||!raum[w])return;var t=ton(hex,raum[w==='sitz'?'hs':'hb']);sf[w]=hex?t:null;ph.querySelector('.st-k.st-'+w).style.background=t[0];ph.querySelector('.st-d.st-'+w).style.background=t[1];ph.querySelector('.st-s.st-'+w).style.background=t[2];
  var g=more&&more.querySelector('.st-grp[data-was="'+w+'"]');if(g)[].forEach.call(g.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',(x.dataset.k||'').toUpperCase()===(hex||'').toUpperCase()?'true':'false')})}
 function adresse(){var u=location.origin+location.pathname.replace(/[^/]*$/,'')+'wandfarbe-testen.html?raum='+raum.slug+'&farbe='+farbe[1].slice(1);if(sf.sitz)u+='&sofa='+sf.sitz[0].slice(1);if(sf.boden)u+='&boden='+sf.boden[0].slice(1);if(halb)u+='&halb=1';if(eve)u+='&abend=1';return u}
 function teilen(){var u=adresse(),t=raum.name+' in '+farbe[0];if(navigator.share){navigator.share({title:'Wandfarben-Studio: '+t,url:u}).then(function(){sag('Geteilt.')},function(){sag('')});return}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){sag('Link kopiert. Wer ihn öffnet, sieht genau diesen Raum.')},function(){zeig(u)});return}zeig(u)}
 function zeig(u){msg.textContent='Dein Link: ';var a=document.createElement('a');a.href=u;a.textContent=u;a.style.wordBreak='break-all';msg.appendChild(a)}
 function setzRaum(r,ersterLauf,dann){art='raum';raum=r;sf={};ph.dataset.art='raum';if(fein)fein.hidden=true;ph.classList.add('lade');
  var neuB=new Image();neuB.onload=function(){img.src=neuB.src;img.alt='Beispielraum: '+r.name+'. Die Wandfarbe wechselt mit den Farbpunkten darunter.';ph.style.setProperty('--mk','url(assets/wf-'+r.slug+'-maske.png)');
   ['boden','sitz'].forEach(function(w){[].forEach.call(ph.querySelectorAll('.st-'+w),function(x){x.style.background=x.classList.contains('st-d')?'#fff':x.classList.contains('st-s')?'#000':'transparent';x.style.setProperty('--mk',r[w]?'url(assets/wf-'+r.slug+'-'+w+'.png)':'none');x.style.display=r[w]?'':'none'})});ph.style.setProperty('--hh',Math.round((r.hh||.42)*100)+'%');ph.classList.remove('lade');if(dann)dann()};
  neuB.src='assets/wf-'+r.slug+'.jpg';
  [].forEach.call(rooms.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',b.dataset.s===r.slug?'true':'false')});
  if(!farbe||!ersterLauf&&!favs.some(function(f){return f[1].toUpperCase()===farbe[1].toUpperCase()})&&!r.farben.some(function(f){return f[1].toUpperCase()===farbe[1].toUpperCase()})&&!PAL.some(function(f){return f[1].toUpperCase()===farbe[1].toUpperCase()})&&!mix.some(function(f){return f[1]===farbe[1].toUpperCase()}))farbe=[r.farben[1][0],r.farben[1][1]];
  punkte();setzFarbe(farbe,false);mehr();if(link)link.innerHTML='Warum diese Farben passen: <a href="wandfarbe-'+r.slug+'.html">'+esc(r.frage)+'</a>';sichern()}
 rooms.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;setzRaum(by[b.dataset.s]);sag('')});

 /* ---------- Zweite Zeile: Sofa, Boden, Abendlicht, Zufall, Speichern ---------- */
 if(more)more.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var g=b.closest('.st-grp');
  if(g){var w=g.dataset.was;[].forEach.call(g.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});setzTon(w,b.dataset.k);return}
  var a=b.dataset.a;
  if(a==='halb'){halb=!halb;ph.classList.toggle('halb',halb);b.setAttribute('aria-pressed',halb?'true':'false');sag(halb?'Unten Farbe, oben bleibt die Wand hell. Das lässt niedrige Räume höher wirken.':'')}
  if(a==='teilen')teilen();
  if(a==='abend'){eve=!eve;ph.classList.toggle('eve',eve);b.setAttribute('aria-pressed',eve?'true':'false')}
  if(a==='zufall'){var r=R[Math.floor(Math.random()*R.length)],f=r.farben[Math.floor(Math.random()*r.farben.length)];farbe=[f[0],f[1]];setzRaum(r);var z=rooms.querySelector('[data-s="'+r.slug+'"]');if(z&&z.scrollIntoView)try{z.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'})}catch(e){}
   sag(r.name+' in '+f[0]+'.')}
  if(a==='speichern')speichern()});

 /* ---------- Bild speichern ---------- */
 function lade(u){return new Promise(function(ok,no){var i=new Image();i.onload=function(){ok(i)};i.onerror=no;i.src=u})}
 function schicht(x,W,H,mk,f,op,oben){var o=document.createElement('canvas');o.width=W;o.height=H;var y=o.getContext('2d');y.fillStyle=f;y.fillRect(0,0,W,H);y.globalCompositeOperation='destination-in';y.drawImage(mk,0,0,W,H);if(oben)y.clearRect(0,0,W,Math.round(H*oben));x.globalCompositeOperation=op;x.drawImage(o,0,0);x.globalCompositeOperation='source-over'}
 function fertig(cvs,W,H,datei,ki){var x=cvs.getContext('2d'),bh=cvs.height-H;x.fillStyle='#fff';x.fillRect(0,H,W,bh);x.fillStyle='#1c1f1d';x.font='600 '+Math.round(bh*.36)+'px system-ui,-apple-system,Segoe UI,sans-serif';x.textBaseline='middle';x.textAlign='left';x.fillText('Wandfarbe: '+farbe[0],Math.round(W*.022),H+bh/2);
  x.font='500 '+Math.round(bh*.26)+'px system-ui,-apple-system,Segoe UI,sans-serif';x.fillStyle='#5d615d';x.textAlign='right';x.fillText('stil-daheim.de'+(ki?' · Beispielbild, mit KI erstellt':''),W-Math.round(W*.022),H+bh/2);
  cvs.toBlob(function(bl){if(!bl){sag('Das Bild ließ sich gerade nicht erstellen. Versuch es gleich noch einmal.');return}var f=new File([bl],datei,{type:'image/jpeg'});
   if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Meine Wandfarbe'}).then(function(){sag('Geteilt.')},function(){sag('')});return}
   var l=document.createElement('a');l.href=URL.createObjectURL(bl);l.download=datei;document.body.appendChild(l);l.click();l.remove();sag('Gespeichert als '+datei+'.')},'image/jpeg',.9)}
 function speichern(){sag('Einen Moment …');
  if(art==='foto'){if(!F.base){sag('Wähl zuerst ein Foto aus.');return}var o=document.createElement('canvas');o.width=F.W;o.height=F.H+Math.round(F.W*.066);o.getContext('2d').drawImage(cv,0,0);fertig(o,F.W,F.H,'meine-wandfarbe.jpg',false);return}
  var W=1280,H=720,s=raum.slug,todo=[lade('assets/wf-'+s+'.jpg'),lade('assets/wf-'+s+'-maske.png')],ws=['boden','sitz'].filter(function(w){return sf[w]});ws.forEach(function(w){todo.push(lade('assets/wf-'+s+'-'+w+'.png'))});
  Promise.all(todo).then(function(a){var c=document.createElement('canvas');c.width=W;c.height=H+84;var x=c.getContext('2d');x.drawImage(a[0],0,0,W,H);schicht(x,W,H,a[1],farbe[1],'multiply',halb?(raum.hh||.42):0);
   ws.forEach(function(w,i){schicht(x,W,H,a[2+i],sf[w][1],'multiply');schicht(x,W,H,a[2+i],sf[w][2],'screen');schicht(x,W,H,a[2+i],sf[w][0],'color')});
   if(eve){x.globalAlpha=.72;x.globalCompositeOperation='multiply';var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#e9b98a');g.addColorStop(1,'#d79c6c');x.fillStyle=g;x.fillRect(0,0,W,H);x.globalAlpha=1;x.globalCompositeOperation='source-over'}
   fertig(c,W,H,'wandfarbe-'+s+'.jpg',true)}).catch(function(){sag('Das Bild ließ sich gerade nicht laden. Versuch es gleich noch einmal.')})}

 /* ---------- Eigenes Foto ---------- */
 var F={W:0,H:0,base:null,mask:null,kante:null,taps:[],x:cv?cv.getContext('2d',{willReadFrequently:true}):null};
 F.kanten=function(){var W=F.W,H=F.H,d=F.base.data,L=new Float32Array(W*H),G=new Float32Array(W*H),i,xx,yy;for(i=0;i<W*H;i++)L[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;
  for(yy=1;yy<H-1;yy++)for(xx=1;xx<W-1;xx++){i=yy*W+xx;G[i]=(L[i]*4+L[i-1]+L[i+1]+L[i-W]+L[i+W])/8}
  F.kante=new Uint8Array(W*H);for(yy=2;yy<H-2;yy++)for(xx=2;xx<W-2;xx++){i=yy*W+xx;var gx=G[i+1]-G[i-1],gy=G[i+W]-G[i-W],dx=G[i+2]-G[i-2],dy=G[i+2*W]-G[i-2*W];F.kante[i]=Math.min(255,Math.max(Math.abs(gx)+Math.abs(gy),(Math.abs(dx)+Math.abs(dy))*.6))}};
 /* Fläche ab einem Punkt füllen: Nachbarn zählen dazu, solange keine Kante dazwischen liegt und der Farbton passt. Die Helligkeit darf stark abweichen (Schatten, Sonnenflecken). */
 F.fill=function(px,py,tol){var W=F.W,H=F.H,d=F.base.data,kante=F.kante,m=new Uint8Array(W*H),n=0,sr=0,sg=0,sb=0;
  for(var yy=Math.max(0,py-3);yy<=Math.min(H-1,py+3);yy++)for(var xx=Math.max(0,px-3);xx<=Math.min(W-1,px+3);xx++){var j=(yy*W+xx)*4;sr+=d[j];sg+=d[j+1];sb+=d[j+2];n++}
  sr/=n;sg/=n;sb/=n;var sl=(sr+sg+sb)/3,kt=4+tol*.42,ct=8+tol*.9,ct2=ct*ct,lt=40+tol*3.2,st=[py*W+px];m[py*W+px]=1;
  while(st.length){var p=st.pop(),cx=p%W,cy=(p-cx)/W;
   for(var k=0;k<4;k++){var nx=cx+(k===0?1:k===1?-1:0),ny=cy+(k===2?1:k===3?-1:0);if(nx<1||ny<1||nx>=W-1||ny>=H-1)continue;var np=ny*W+nx;if(m[np]||kante[np]>kt)continue;var e=np*4,r=d[e],g=d[e+1],b=d[e+2],l=(r+g+b)/3;
    if(Math.abs(l-sl)>lt)continue;var f=l>8?sl/l:1,cr=r*f-sr,cg=g*f-sg,cb=b*f-sb;if(cr*cr+cg*cg+cb*cb>ct2)continue;m[np]=1;st.push(np)}}
  var o=new Uint8Array(W*H),t=new Uint8Array(W*H),i;for(var a=0;a<2;a++){for(i=W+1;i<W*H-W-1;i++)t[i]=m[i]|m[i-1]|m[i+1]|m[i-W]|m[i+W];for(i=0;i<W*H;i++)m[i]=t[i]}
  for(i=W+1;i<W*H-W-1;i++)o[i]=m[i]&m[i-1]&m[i+1]&m[i-W]&m[i+W];return o};
 F.rebuild=function(){F.mask=new Uint8Array(F.W*F.H);F.taps.forEach(function(t){var m=F.fill(t[0],t[1],t[2]);for(var i=0;i<m.length;i++)if(m[i])F.mask[i]=1})};
 F.draw=function(){var W=F.W,H=F.H,x=F.x,out=x.createImageData(W,H),o=out.data,d=F.base.data,mask=F.mask,c=rgb(farbe[1]),s=0,n=0,i;
  for(i=0;i<mask.length;i++)if(mask[i]){s+=(d[i*4]+d[i*4+1]+d[i*4+2])/3;n++}
  var mean=n?s/n:255,soft=new Float32Array(W*H);for(var yy=1;yy<H-1;yy++)for(var xx=1;xx<W-1;xx++){var p=yy*W+xx;soft[p]=(mask[p]*4+mask[p-1]+mask[p+1]+mask[p-W]+mask[p+W])/8}
  for(i=0;i<mask.length;i++){var q=i*4,a=soft[i],r=d[q],g=d[q+1],b=d[q+2];if(a>0){var f=Math.min(1.35,((r+g+b)/3)/mean);r=r*(1-a)+Math.min(255,c[0]*f)*a;g=g*(1-a)+Math.min(255,c[1]*f)*a;b=b*(1-a)+Math.min(255,c[2]*f)*a}o[q]=r;o[q+1]=g;o[q+2]=b;o[q+3]=255}
  x.putImageData(out,0,0);return n/(W*H)};
 /* Wand selbst suchen: Punkte im oberen Bildteil probieren, die größte zusammenhängende Fläche gewinnt */
 F.auto=function(){var W=F.W,H=F.H,tol=+fein.querySelector('input').value,best=null,ba=0;
  for(var gy=0;gy<3;gy++)for(var gx=0;gx<5;gx++){var px=Math.round(W*(.14+gx*.18)),py=Math.round(H*(.1+gy*.17)),m=F.fill(px,py,tol),n=0;for(var i=0;i<m.length;i+=7)n+=m[i];var an=n*7/(W*H);if(an>ba&&an<.64){ba=an;best=[px,py,tol]}}
  if(!best||ba<.06){F.taps=[];F.mask=new Uint8Array(W*H);F.x.putImageData(F.base,0,0);return false}F.taps=[best];F.rebuild();F.draw();return true};
 function setzFoto(bild){art='foto';ph.dataset.art='foto';var k=Math.min(1,1280/Math.max(bild.naturalWidth,bild.naturalHeight));F.W=Math.max(1,Math.round(bild.naturalWidth*k));F.H=Math.max(1,Math.round(bild.naturalHeight*k));
  cv.width=F.W;cv.height=F.H;ph.style.aspectRatio=F.W+'/'+F.H;F.x.drawImage(bild,0,0,F.W,F.H);F.base=F.x.getImageData(0,0,F.W,F.H);F.kanten();F.taps=[];F.mask=new Uint8Array(F.W*F.H);
  [].forEach.call(rooms.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed','false')});fein.hidden=false;punkte();titel();mehr();link.textContent='';sag('Einen Moment, ich suche deine Wand …');
  setTimeout(function(){var ok=false;try{ok=F.auto()}catch(e){}sag(ok?'Das ist deine Wand in '+farbe[0]+'. Fehlt ein Stück? Tipp im Bild einfach darauf.':'Tipp im Bild auf deine Wand, dann färbe ich sie ein.')},60)}
 function zurRaum(){ph.style.aspectRatio=''}
 if(voll){
  rooms.addEventListener('change',function(ev){var f=ev.target.files&&ev.target.files[0];if(!f)return;var u=URL.createObjectURL(f),b=new Image();b.onload=function(){setzFoto(b);URL.revokeObjectURL(u)};b.onerror=function(){sag('Dieses Bild lässt sich nicht öffnen. Nimm am besten ein Foto als JPG oder PNG.')};b.src=u;ev.target.value=''});
  rooms.addEventListener('click',function(ev){if(ev.target.closest('button'))zurRaum()},true);
  var letzt=0;function tipp(ev){if(art!=='foto'||!F.base)return;var t=Date.now();if(t-letzt<350)return;letzt=t;var r=cv.getBoundingClientRect(),px=Math.round((ev.clientX-r.left)/r.width*F.W),py=Math.round((ev.clientY-r.top)/r.height*F.H);if(px<1||py<1||px>=F.W-1||py>=F.H-1)return;
   F.taps.push([px,py,+fein.querySelector('input').value]);F.rebuild();var an=F.draw();sag(an>.85?'Jetzt ist fast alles eingefärbt. Schieb unter „Feiner einstellen“ die Genauigkeit nach links.':'Dazugenommen.')}
  cv.addEventListener('click',tipp);cv.addEventListener('pointerup',function(ev){if(ev.pointerType==='touch'||ev.pointerType==='pen')tipp(ev)});
  fein.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b||!F.base)return;if(b.dataset.a==='zurueck'){F.taps.pop();F.rebuild();F.draw();sag(F.taps.length?'':'Tipp im Bild auf deine Wand.')}if(b.dataset.a==='neu'){sag(F.auto()?'Neu gesucht.':'Tipp im Bild auf deine Wand.')}});
  fein.querySelector('input').addEventListener('change',function(){if(!F.base||!F.taps.length)return;var v=+this.value;F.taps.forEach(function(t){t[2]=v});F.rebuild();F.draw()});
  if(location.hash==='#foto')setTimeout(function(){var l=rooms.querySelector('.st-eig');if(l){try{l.scrollIntoView({block:'center'})}catch(e){}sag('Tipp auf „Eigenes Foto“ und wähl ein Bild von deinem Zimmer.')}},400)}

 /* ---------- Start ---------- */
 leiste();var r0=by[P.raum]||by[M.r]||by[el.dataset.raum]||by['graues-sofa']||R[0];if(M.c&&M.c[1])farbe=[M.c[0],M.c[1]];
 function nameVon(h){var n='';[mix,favs,r0.farben,PAL].forEach(function(L){L.forEach(function(f){if(!n&&f[1].toUpperCase()===h)n=f[0]})});return n}
 var qf=hx(P.farbe);if(qf){var qn=nameVon(qf);if(!qn){qn='Geteilte Farbe';mix.unshift([qn,qf])}farbe=[qn,qf]}else if(mix.length)farbe=[mix[0][0],mix[0][1]];
 if(P.halb==='1'){halb=true;ph.classList.add('halb')}if(P.abend==='1'){eve=true;ph.classList.add('eve')}
 setzRaum(r0,true,function(){if(hx(P.sofa))setzTon('sitz',hx(P.sofa));if(hx(P.boden))setzTon('boden',hx(P.boden))});
 if(mix.length&&!qf)sag('Das sind die Farben aus deinem Stil. Tipp sie nacheinander an.');
 el.STUDIO={adresse:function(){return adresse()},ral:ral,raum:function(){return raum&&raum.slug},farbe:function(){return farbe},art:function(){return art},foto:F,setzFoto:setzFoto};
}

function los(){var els=document.querySelectorAll('.st[data-studio]');if(!els.length)return;
 fetch('assets/studio.json').then(function(r){return r.json()}).then(function(R){[].forEach.call(els,function(el){try{start(el,R)}catch(e){el.innerHTML='<p>Das Studio ließ sich gerade nicht laden. <a href="wandfarben.html">Hier geht es zu allen Räumen.</a></p>'}})})
 .catch(function(){[].forEach.call(els,function(el){el.innerHTML='<p>Das Studio ließ sich gerade nicht laden. <a href="wandfarben.html">Hier geht es zu allen Räumen.</a></p>'})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',los);else los();
})();
