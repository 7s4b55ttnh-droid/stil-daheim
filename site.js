/* Stil-Daheim – gemeinsame Bedienung: Menü, Hell/Dunkel, Kopfzeile über Fotos, Nach oben, Teilen, Drucken, Checklisten. */
(function(){
  var d=document,root=d.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s,c){return (c||d).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}

  /* In einer eingebetteten Vorschau gibt es keinen Druckdialog: Druckknöpfe dort ausblenden */
  try{if(window.top!==window.self)root.classList.add('framed')}catch(e){root.classList.add('framed')}

  /* Hell/Dunkel */
  var th=$('#th');
  function isDark(){var a=root.dataset.theme;return a?a==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  function thState(){if(th)th.setAttribute('aria-pressed',String(isDark()))}
  if(th){th.addEventListener('click',function(){var v=isDark()?'light':'dark';root.dataset.theme=v;try{localStorage.setItem('sdth',v)}catch(e){}thState()});thState();
    try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',thState)}catch(e){}}

  /* Menü */
  var mb=$('#mb'),sheet=$('#msheet'),cl=$('#mclose'),last=null;
  function openM(){last=d.activeElement;sheet.hidden=false;mb.setAttribute('aria-expanded','true');root.style.overflow='hidden';cl.focus()}
  function closeM(){if(sheet.hidden)return;sheet.hidden=true;mb.setAttribute('aria-expanded','false');root.style.overflow='';if(last&&last.focus)last.focus()}
  if(mb&&sheet){
    mb.addEventListener('click',openM);cl.addEventListener('click',closeM);
    sheet.addEventListener('click',function(e){if(e.target===sheet||e.target.closest('a'))closeM()});
    d.addEventListener('keydown',function(e){
      if(e.key==='Escape')closeM();
      if(e.key==='Tab'&&!sheet.hidden){var f=$$('a,button',sheet);if(!f.length)return;var a=f[0],z=f[f.length-1];
        if(e.shiftKey&&d.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&d.activeElement===z){e.preventDefault();a.focus()}}
    });
    /* Auf dieser Seite: aus Abschnitten mit Überschrift */
    var toc=$('#mtoc'),wrap=$('#mtoc-wrap'),seen={};
    $$('#tabs [role=tab]').forEach(function(b){var a=d.createElement('a');a.href='#'+b.id.slice(2);a.textContent=b.textContent;toc.appendChild(a)});
    $$('main section[id], main article[id]').forEach(function(el){
      var h=el.querySelector('h2');if(!h)return;var t=h.textContent.replace(/\s+/g,' ').replace(/[.?!]$/,'').trim();if(seen[t])return;seen[t]=1;
      var a=d.createElement('a');a.href='#'+el.id;a.textContent=t;toc.appendChild(a);
    });
    if(toc.children.length>1)wrap.hidden=false;
  }

  /* Kopfzeile hell auf Fotos */
  var hd=$('#hd'),darks=$$('.hero,.pic'),tick=0;
  function hdr(){tick=0;if(!hd)return;var y=40,on=false;for(var i=0;i<darks.length;i++){var r=darks[i].getBoundingClientRect();if(r.top<=y&&r.bottom>y){on=true;break}}hd.classList.toggle('ondark',on)}

  /* Maßlinien über Fotos: Lage in Bildanteilen (data-at), umgerechnet auf den sichtbaren Ausschnitt bei object-fit: cover */
  function placeDims(){$$('.hdim[data-at]').forEach(function(d){
    var hero=d.closest('.hero'),img=hero&&hero.querySelector('img');if(!img||!img.naturalWidth||!hero.clientWidth)return;
    var W=hero.clientWidth,H=hero.clientHeight,s=Math.max(W/img.naturalWidth,H/img.naturalHeight),rw=img.naturalWidth*s,rh=img.naturalHeight*s;
    var p=getComputedStyle(img).objectPosition.split(' '),px=parseFloat(p[0])/100,py=parseFloat(p[1]||'50%')/100;if(isNaN(px))px=.5;if(isNaN(py))py=.5;
    var ox=(W-rw)*px,oy=(H-rh)*py,a=d.getAttribute('data-at').split(',').map(Number);
    var fits;
    if(d.classList.contains('v')){var t=oy+a[1]*rh,b=oy+a[2]*rh,x=ox+a[0]*rw;d.style.left=(x-15)+'px';d.style.top=t+'px';d.style.height=(b-t)+'px';fits=t>64&&b<H-8&&x>8&&x<W-8}
    else{var l=ox+a[0]*rw,r=ox+a[1]*rw,y=oy+a[2]*rh;d.style.left=l+'px';d.style.width=(r-l)+'px';d.style.top=(y-15)+'px';fits=l>8&&r<W-8&&y>64&&y<H-8}
    d.classList.toggle('on',fits)})}
  $$('.hero img').forEach(function(img){if(img.complete)placeDims();else img.addEventListener('load',placeDims)});
  addEventListener('resize',placeDims);

  /* Nach oben */
  var tt=d.createElement('button');tt.className='totop';tt.type='button';tt.setAttribute('aria-label','Nach oben');
  tt.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';d.body.appendChild(tt);
  tt.addEventListener('click',function(){scrollTo({top:0,behavior:RM?'auto':'smooth'})});
  function onScroll(){if(!tick){tick=requestAnimationFrame(function(){hdr();tt.classList.toggle('on',scrollY>innerHeight*1.5)})}}
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);hdr();onScroll();

  /* Hinweis */
  var toastEl=null,tT=0;
  window.sdToast=function(msg){if(!toastEl){toastEl=d.createElement('div');toastEl.className='toast';toastEl.setAttribute('role','status');d.body.appendChild(toastEl)}
    toastEl.textContent=msg;toastEl.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){toastEl.classList.remove('on')},2600)};

  /* Teilen: Text aus dem Element mit der angegebenen ID plus Link */
  d.addEventListener('click',function(e){
    var b=e.target.closest('[data-share]');if(!b)return;
    var src=d.getElementById(b.getAttribute('data-share')),sec=b.closest('section[id]');
    var url=b.getAttribute('data-share-url')||(location.href.split('#')[0].split('?')[0]+(sec?'#'+sec.id:''));
    var text=b.getAttribute('data-share-text');
    if(!text&&src){var cl=src.cloneNode(true);$$('a,.tag',cl).forEach(function(x){x.remove()});$$('.big',cl).forEach(function(x){x.textContent=x.textContent+'. '});text=cl.textContent}
    text=(text||d.title).replace(/\s+/g,' ').replace(/\s+\./g,'.').trim();
    function copy(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text+' '+url).then(function(){sdToast('Ergebnis und Link kopiert')},function(){sdToast('Kopieren nicht möglich')})}else sdToast('Kopieren nicht möglich')}
    if(navigator.share){navigator.share({title:d.title,text:text,url:url}).catch(function(err){if(!err||err.name!=='AbortError')copy()});return}
    copy();
  });

  /* Drucken */
  var pt=null;
  d.addEventListener('click',function(e){var b=e.target.closest('[data-print]');if(!b)return;pt=b.closest('main>section');if(pt){pt.classList.add('ptarget');root.classList.add('plist')}print()});
  addEventListener('afterprint',function(){root.classList.remove('plist');if(pt)pt.classList.remove('ptarget');pt=null});
  var closed=[];
  addEventListener('beforeprint',function(){closed=$$('details:not([open])');closed.forEach(function(x){x.open=true})});
  addEventListener('afterprint',function(){closed.forEach(function(x){x.open=false});closed=[]});

  /* Checkliste: Fortschritt oben, erledigte Punkte gedimmt, Liste leeren, Abschlussnachricht. Gespeichert nur im Browser. */
  window.sdChecklist=function(id,items,key,words){var box=d.getElementById(id);if(!box)return;var s=[];try{s=JSON.parse(localStorage.getItem(key)||'[]')||[]}catch(e){}
    words=words||{};var verb=words.verb||'geprüft',done=words.done||'Alles erledigt.';
    box.innerHTML='<div class="ck-h"><p class="ckt" aria-live="polite"></p><div class="ckbar" aria-hidden="true"><i></i></div><button type="button" data-reset>Liste leeren</button></div>'+
      items.map(function(t,i){return '<label><input type="checkbox" data-i="'+i+'"><span><b>'+t[0]+'</b><small>'+t[1]+'</small></span></label>'}).join('')+'<p class="ck-done" aria-live="polite"></p>';
    var ins=$$('input',box),bar=$('.ckbar i',box),txt=$('.ckt',box),fin=$('.ck-done',box);
    function up(){var n=0;ins.forEach(function(b){var on=!!s[b.dataset.i];b.checked=on;b.closest('label').classList.toggle('done',on);if(on)n++});
      bar.style.width=(n/items.length*100)+'%';txt.textContent=n+' von '+items.length+' '+verb;fin.textContent=n===items.length?done:''}
    function save(){try{localStorage.setItem(key,JSON.stringify(s))}catch(e){}}
    ins.forEach(function(b){b.addEventListener('change',function(){s[b.dataset.i]=b.checked;save();up()})});
    $('[data-reset]',box).addEventListener('click',function(){s=[];save();up();sdToast('Liste geleert')});
    up()};
})();

/* Bewegung: Auswahl für Stil-Daheim */
window.__MOTION={reveal:'.item,.hub.rel a,.steps>li,.fact,.pstrip,.kv,.sec-h,.faq,.law,.result',
 extra:function(io){var H=innerHeight;[].filter.call(document.querySelectorAll('.palette,.fan'),function(p){return p.getBoundingClientRect().top>=H}).forEach(function(p){[].forEach.call(p.children,function(c,i){c.style.setProperty('--i',i)});p.classList.add('fn');io.observe(p)});
  var sh=document.querySelector('.sheet');if(sh){var o=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;o.disconnect();sh.classList.add('drw');setTimeout(function(){sh.classList.remove('drw')},2200)},{threshold:.3});o.observe(sh)}}};
/* Bewegung: Inhalte gleiten beim Scrollen sanft ins Bild, Ergebniszahlen zählen einmal hoch.
   Aus bei „Bewegung reduzieren“. Was beim Laden schon sichtbar ist, bleibt ruhig (schnelles Laden). */
(function(){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var C=window.__MOTION||{},d=document,H=innerHeight;
  function ready(f){d.readyState==='loading'?d.addEventListener('DOMContentLoaded',f):f()}
  function count(el){var t=el.textContent,m=t.match(/^(\D*?)(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?(\D*)$/);
    if(!m||/[–-]/.test(t))return;var dec=m[3]?m[3].length-1:0,v=parseFloat((m[2]+(m[3]||'')).replace(/\./g,'').replace(',','.'));
    if(!(v>0))return;var t0=performance.now(),last=t;
    (function step(n){if(el.textContent!==last)return;var p=Math.min(1,(n-t0)/700),e=1-Math.pow(1-p,3);
      last=m[1]+(v*e).toLocaleString('de-DE',{minimumFractionDigits:dec,maximumFractionDigits:dec})+m[4];if(p>=1)last=t;el.textContent=last;if(p<1)requestAnimationFrame(step)})(t0)}
  ready(function(){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;io.unobserve(el);
      el.classList.add('in');if(el.classList.contains('rv'))setTimeout(function(){el.classList.remove('rv','in');el.style.removeProperty('--rd')},1400);if(el.__cnt)el.__cnt.forEach(count);
      if(C.onIn)C.onIn(el)})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    /* Erst alles messen, dann ändern: verhindert wiederholtes Neuberechnen des Layouts */
    var L=[].filter.call(d.querySelectorAll(C.reveal||''),function(el){if(el.closest('.hero,.hd,.sh,.sh-sheet,.sheet-m,header,footer'))return false;
      var po=getComputedStyle(el.parentElement).overflowX;return po!=='auto'&&po!=='scroll'&&el.getBoundingClientRect().top>=H});
    L.forEach(function(el){var sib=0,p=el.previousElementSibling;while(p&&sib<5){if(p.matches(C.reveal))sib++;p=p.previousElementSibling}el.__rd=sib*70;
      if(C.count){var cs=[].slice.call(el.querySelectorAll(C.count));if(el.matches(C.count))cs.push(el);if(cs.length)el.__cnt=cs}});
    L.forEach(function(el){el.style.setProperty('--rd',el.__rd+'ms');el.classList.add('rv');io.observe(el)});
    if(C.extra)C.extra(io);
  });
})();
