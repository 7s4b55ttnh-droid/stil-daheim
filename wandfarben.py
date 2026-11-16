#!/usr/bin/env python3
"""Baut die Seiten „Welche Wandfarbe passt zu …?“ aus wandfarben.json:
pages/wandfarben.html (Übersicht) und pages/wandfarbe-<slug>.html (eine je Kombination).
build.py ruft das vor jedem Bau auf. Diese Seiten nie von Hand ändern, sondern wandfarben.json oder diese Datei.
Regeln: Die Unterseiten bekommen KEINE Kachel auf der Startseite und KEINEN Menüeintrag, nur die Übersicht steht in GRID.
Jede neue Kombination braucht vier begründete Wandfarben, eine Farbe für „Lieber nicht“, Akzent, Lichthinweis und zwei Fragen."""
import json, pathlib, html

HERE = pathlib.Path(__file__).resolve().parent
AUS = pathlib.Path(__import__('os').environ.get('STIL_OUT') or HERE.parent / 'stil-daheim')   # Ausgabe-Ordner (Zweig main), dort liegen die Fotos
D = json.loads((HERE / 'wandfarben.json').read_text(encoding='utf-8'))['seiten']
BY = {d['slug']: d for d in D}
STAND = '2026-11-16'
FEST = {'wandfarbe-testen'}     # von Hand geschriebene Seiten mit dem Anfang wandfarbe-, die beim Aufräumen NICHT gelöscht werden
TYP = [('moebel', 'Möbel'), ('sofa', 'Sofa'), ('boden', 'Boden'), ('raum', 'Raum und Licht')]
EICHE, SOFA, HOLZ = '#C9A66B', '#B9B4AA', '#C8A977'

CSS = '''<style>
.top{padding-block:calc(env(safe-area-inset-top,0px) + 120px) clamp(24px,4vw,44px)}
.top .eyebrow{font-size:.95rem;font-weight:600;color:var(--brass-t);margin:0 0 14px}.top .eyebrow a{color:inherit}
.top h1{font-size:clamp(2.2rem,5.6vw,3.7rem)}
.wf-room{margin-top:22px}
.wf-ph{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--band)}
.wf-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.wf-lay2{clip-path:inset(0 0 0 var(--cut,100%))}.wf-lay2 i{background:var(--w2)}
.wf-ph.cmp .wf-lay:not(.wf-lay2){clip-path:inset(0 calc(100% - var(--cut,50%)) 0 0)}
.wf-k,.wf-d{position:absolute;inset:0;-webkit-mask:var(--mk) center/100% 100% no-repeat;mask:var(--mk) center/100% 100% no-repeat;transition:background-color .6s ease;background:transparent}
.wf-k{mix-blend-mode:color}.wf-d{mix-blend-mode:multiply}
.wf-eve{position:absolute;inset:0;mix-blend-mode:multiply;background:linear-gradient(180deg,#e9b98a,#d79c6c);opacity:0;transition:opacity .7s ease;pointer-events:none}
.wf-ph.eve .wf-eve{opacity:.72}
.wf-cut{position:absolute;inset:0}.wf-cut[hidden]{display:none}
.wf-cut span{position:absolute;top:0;bottom:0;left:var(--cut,50%);width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)}
.wf-cut span::after{content:"";position:absolute;top:50%;left:50%;width:38px;height:38px;margin:-19px;border-radius:50%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.3)}
.wf-cut input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize;touch-action:pan-y}
.wf-cut input:focus-visible+*{outline:2px solid var(--ink)}
.wf-tools{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0}
.wf-tools button,.wf-ch2 button{font:inherit;font-size:.92rem;font-weight:600;min-height:44px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:var(--pan);color:var(--ink);cursor:pointer}
.wf-tools button[aria-pressed="true"],.wf-ch2 button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.wf-r2{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:14px 0 0;font-size:.92rem;font-weight:600}.wf-r2[hidden]{display:none}
.wf-ch2{margin:0}
.wf-dots{display:flex;gap:8px}.wf-dots button{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--line);background:var(--pan);padding:0;cursor:pointer;display:grid;place-items:center}
.wf-dots button i{width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,0,0,.14)}.wf-dots button[aria-pressed="true"]{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
.wf-msg{font-size:.9rem;color:var(--mut);margin:10px 0 0;min-height:1.3em}
@media (prefers-reduced-motion:reduce){.wf-k,.wf-d,.wf-eve{transition:none}}
.wf-ph .ki-marke{background:rgba(0,0,0,.66)!important}
.wf-lay{position:absolute;inset:0;mix-blend-mode:multiply;-webkit-mask:var(--mk) center/100% 100% no-repeat;mask:var(--mk) center/100% 100% no-repeat}
.wf-lay i{position:absolute;inset:0}
#wf-alt{background:var(--w)}
#wf-neu{background:var(--n,transparent);clip-path:polygon(0 0,0 0,-18% 100%,-18% 100%)}
#wf-neu.go{transition:clip-path .9s cubic-bezier(.65,0,.25,1);clip-path:polygon(0 0,118% 0,100% 100%,-18% 100%)}
@media (prefers-reduced-motion:reduce){#wf-neu.go{transition:none}}
.wf-room svg{display:block;width:100%;height:auto;border-radius:18px;border:1px solid var(--line)}
.wf-room svg *{transition:fill .5s ease}
.wf-w{fill:var(--w)}.wf-f{fill:var(--f)}.wf-s{fill:var(--s)}.wf-m{fill:var(--m)}.wf-a{fill:var(--a)}.wf-dk{filter:brightness(.86)}.wf-lt{filter:brightness(1.08)}
.wf-ch{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0}
.wf-ch button{display:flex;align-items:center;gap:9px;min-height:46px;padding:6px 16px 6px 7px;border-radius:999px;border:1.5px solid var(--line);background:var(--pan);color:var(--ink);font:inherit;font-size:.95rem;font-weight:600;cursor:pointer}
.wf-ch button i{width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,0,0,.14);flex:none}
.wf-ch button[aria-pressed="true"]{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
.wf-ch button.no{border-style:dashed}
.wf-say{margin:14px 0 0;min-height:3.2em;font-size:1.02rem;max-width:60ch}.wf-say b{display:block}
.wf-note{font-size:.88rem;color:var(--mut);margin:10px 0 0;max-width:62ch}
.wf-cards{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.wf-card{background:var(--pan);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.wf-card i{display:block;height:92px;border-bottom:1px solid var(--line)}
.wf-card div{padding:16px 18px 18px}.wf-card h3{margin:0 0 2px;font-size:1.12rem}.wf-card small{color:var(--mut);font-size:.84rem;letter-spacing:.02em}
.wf-card p{margin:8px 0 0;font-size:.96rem}
.wf-bar{display:grid;grid-template-columns:6fr 3fr 1fr;height:118px;border-radius:14px;overflow:hidden;border:1px solid var(--line);margin:22px 0 10px}
.wf-bar span{display:flex;align-items:flex-end;padding:8px;font-size:.84rem;font-weight:650;line-height:1.2}
.wf-bar span b{background:#fff;color:#1c1f1d;padding:2px 7px;border-radius:7px;font-weight:650}
.wf-bar span:last-child{padding:8px 2px;justify-content:center}
.wf-leg{display:grid;gap:6px;margin:0;padding:0;list-style:none;font-size:.96rem}
.wf-more{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin-top:8px}
.wf-more a,.wf-hub a{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;padding:14px 16px;border-radius:16px;border:1px solid var(--line);background:var(--pan);color:var(--ink);text-decoration:none;font-weight:600;min-height:72px}
.wf-more a:hover,.wf-hub a:hover{border-color:var(--ink)}
.wf-du{display:block;width:44px;height:44px;border-radius:50%;border:1px solid rgba(0,0,0,.14);background:linear-gradient(90deg,var(--c1) 50%,var(--c2) 50%)}
.wf-more small,.wf-hub small{display:block;font-weight:400;color:var(--mut);font-size:.88rem;margin-top:2px}
.wf-also{margin-top:22px;display:flex;flex-wrap:wrap;gap:8px 18px;font-weight:600}
.wf-hub{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(270px,1fr))}
.wf-hub a[hidden]{display:none}
.wf-fl{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0}
.wf-fl button{font:inherit;font-size:.94rem;font-weight:600;min-height:44px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:var(--pan);color:var(--ink);cursor:pointer}
.wf-fl button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.wf-buy{margin-top:18px;font-size:.96rem}
@media (prefers-reduced-motion:reduce){.wf-room svg *{transition:none}}
</style>'''


ROOM_JS = '''<script>
(function(){var r=document.getElementById('wf-room'),c=document.getElementById('wf-ch'),s=document.getElementById('wf-say');if(!r||!c)return;
 var st={w:r.style.getPropertyValue('--w'),wn:'',w2:r.style.getPropertyValue('--w2'),cmp:0,cut:50,eve:0,k:{},d:{}};window.WF=st;
 function press(g,b){[].forEach.call(g.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')})}
 c.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;press(c,b);
  s.innerHTML='<b></b>';s.firstChild.textContent=b.textContent;s.appendChild(document.createTextNode(b.dataset.t));st.wn=b.textContent;
  var n=document.getElementById('wf-neu');if(!n){r.style.setProperty('--w',b.dataset.c);return}
  clearTimeout(r._t);if(n.classList.contains('go')){r.style.setProperty('--w',st.w);n.classList.remove('go')}
  st.w=b.dataset.c;r.style.setProperty('--n',b.dataset.c);void n.offsetWidth;n.classList.add('go');
  r._t=setTimeout(function(){r.style.setProperty('--w',b.dataset.c);n.classList.remove('go')},950)});
 st.wn=(c.querySelector('[aria-pressed="true"]')||{}).textContent||'';
 var eb=document.getElementById('wf-eveb'),cb=document.getElementById('wf-cmpb'),sv=document.getElementById('wf-save'),r2=document.getElementById('wf-r2'),cut=r.querySelector('.wf-cut'),msg=document.getElementById('wf-msg');
 if(!eb)return;
 eb.addEventListener('click',function(){st.eve=st.eve?0:1;r.classList.toggle('eve',!!st.eve);eb.setAttribute('aria-pressed',st.eve?'true':'false')});
 function setcut(v){st.cut=+v;r.style.setProperty('--cut',v+'%')}
 cb.addEventListener('click',function(){st.cmp=st.cmp?0:1;r.classList.toggle('cmp',!!st.cmp);cb.setAttribute('aria-pressed',st.cmp?'true':'false');cut.hidden=!st.cmp;r2.hidden=!st.cmp;
  if(st.cmp)setcut(cut.querySelector('input').value);else r.style.removeProperty('--cut')});
 cut.querySelector('input').addEventListener('input',function(){setcut(this.value)});
 r2.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;press(r2,b);st.w2=b.dataset.c;r.style.setProperty('--w2',b.dataset.c)});
 [].forEach.call(document.querySelectorAll('.wf-ch2'),function(g){g.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;press(g,b);var w=g.dataset.was;
  st.k[w]=b.dataset.k;st.d[w]=b.dataset.d;r.querySelector('.wf-k.wf-'+w).style.background=b.dataset.k||'transparent';r.querySelector('.wf-d.wf-'+w).style.background=b.dataset.d||'transparent'})});
 /* Bild speichern: dieselben Ebenen wie im Browser, auf einer Zeichenfläche zusammengesetzt (1280 x 720), mit Farbname, Seitenname und KI-Hinweis */
 function lade(u){return new Promise(function(ok,no){var i=new Image();i.onload=function(){ok(i)};i.onerror=no;i.src=u})}
 function url(v){return (v.match(/url\\(["']?([^"')]+)/)||[])[1]}
 function schicht(x,W,H,mk,farbe,op,clip){var o=document.createElement('canvas');o.width=W;o.height=H;var y=o.getContext('2d');y.fillStyle=farbe;
  if(clip)y.fillRect(clip[0],0,clip[1],H);else y.fillRect(0,0,W,H);
  if(mk){y.globalCompositeOperation='destination-in';y.drawImage(mk,0,0,W,H)}x.globalCompositeOperation=op;x.drawImage(o,0,0);x.globalCompositeOperation='source-over'}
 sv.addEventListener('click',function(){sv.disabled=true;msg.textContent='Bild wird erstellt …';
  var im=r.querySelector('img'),W=1280,H=720,slug=r.dataset.slug,todo=[lade(im.currentSrc||im.src),lade(url(r.style.getPropertyValue('--mk')))],ws=['boden','sitz'].filter(function(w){return st.k[w]});
  ws.forEach(function(w){todo.push(lade('assets/wf-'+slug+'-'+w+'.png'))});
  Promise.all(todo).then(function(a){var cv=document.createElement('canvas');cv.width=W;cv.height=H+84;var x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H+84);x.drawImage(a[0],0,0,W,H);
   var cx=Math.round(W*st.cut/100);
   if(st.cmp){schicht(x,W,H,a[1],st.w,'multiply',[0,cx]);schicht(x,W,H,a[1],st.w2,'multiply',[cx,W-cx])}else schicht(x,W,H,a[1],st.w,'multiply');
   ws.forEach(function(w,i){schicht(x,W,H,a[2+i],st.k[w],'color');schicht(x,W,H,a[2+i],st.d[w],'multiply')});
   if(st.eve){x.globalAlpha=.72;x.globalCompositeOperation='multiply';var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#e9b98a');g.addColorStop(1,'#d79c6c');x.fillStyle=g;x.fillRect(0,0,W,H);x.globalAlpha=1;x.globalCompositeOperation='source-over'}
   if(st.cmp){x.fillStyle='#fff';x.fillRect(cx-2,0,4,H)}
   var n2=(r2.querySelector('[aria-pressed="true"]')||{}).title||'';
   x.fillStyle='#1c1f1d';x.font='600 30px system-ui,-apple-system,Segoe UI,sans-serif';x.textBaseline='middle';x.fillText('Wandfarbe: '+st.wn.replace('Lieber nicht: ','')+(st.cmp&&n2?' und '+n2:''),28,H+42);
   x.font='500 22px system-ui,-apple-system,Segoe UI,sans-serif';x.fillStyle='#5d615d';x.textAlign='right';x.fillText('stil-daheim.de · Beispielbild, mit KI erstellt',W-28,H+42);
   cv.toBlob(function(bl){sv.disabled=false;if(!bl){msg.textContent='Das Bild konnte nicht erstellt werden.';return}
    var f=new File([bl],'wandfarbe-'+slug+'.jpg',{type:'image/jpeg'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:document.title}).then(function(){msg.textContent='Bild geteilt.'},function(){msg.textContent=''});return}
    var l=document.createElement('a');l.href=URL.createObjectURL(bl);l.download=f.name;document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(l.href)},4000);msg.textContent='Bild gespeichert: '+f.name},'image/jpeg',.9)
  }).catch(function(){sv.disabled=false;msg.textContent='Das Bild konnte nicht geladen werden. Bitte noch einmal versuchen.'})});
})();
</script>'''


def e(s):
    return html.escape(s, quote=True)


def ink(hx):
    """Schriftfarbe, die auf dem Farbfeld lesbar ist."""
    r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))
    lin = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return '#1c1f1d' if .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b) > .18 else '#ffffff'


def room_svg(d):
    """Gezeichnetes Beispielzimmer (Ersatz, falls für die Seite kein Foto in assets/ liegt). Fest ist das, worum es auf der Seite geht (Möbel, Sofa oder Boden), die Wand wechselt per Knopf."""
    f = d['fix'] if d['typ'] == 'boden' else EICHE
    s = d['fix'] if d['typ'] == 'sofa' else SOFA
    m = d['fix'] if d['typ'] == 'moebel' else HOLZ
    was = {'moebel': 'Die Möbel haben die Farbe von ' + d['kurz'], 'sofa': 'Das Sofa ist ein ' + d['kurz'], 'boden': 'Der Boden ist ein ' + d['kurz'], 'raum': 'Boden und Möbel sind aus hellem Holz'}[d['typ']]
    return ('<div class="wf-room" id="wf-room" style="--w:%s;--f:%s;--s:%s;--m:%s;--a:%s">'
            '<svg viewBox="0 0 400 250" role="img" aria-label="Gezeichnetes Beispielzimmer. %s. Die Wandfarbe wechselt mit den Knöpfen darunter.">'
            '<rect class="wf-w" width="400" height="178"/><rect class="wf-f" y="178" width="400" height="72"/><rect class="wf-f wf-dk" y="178" width="400" height="3"/>'
            '<rect x="0" y="171" width="400" height="7" fill="#f4f2ec"/>'
            '<rect x="28" y="26" width="84" height="100" rx="3" fill="#f4f2ec"/><rect x="34" y="32" width="33" height="88" fill="#cfe3f1"/><rect x="73" y="32" width="33" height="88" fill="#cfe3f1"/>'
            '<path d="M112 178 L190 250 L60 250 L28 178Z" fill="#fff" opacity=".13"/>'
            '<rect x="248" y="34" width="58" height="70" rx="2" fill="#f4f2ec"/><rect x="256" y="42" width="42" height="54" fill="#e3ddd0"/><circle class="wf-a" cx="277" cy="69" r="13"/>'
            '<ellipse cx="268" cy="218" rx="118" ry="20" fill="#e9e3d6"/>'
            '<rect class="wf-m" x="26" y="136" width="118" height="40" rx="3"/><rect class="wf-m wf-dk" x="26" y="154" width="118" height="2"/><rect class="wf-m wf-dk" x="84" y="136" width="2" height="40"/>'
            '<rect class="wf-m wf-dk" x="34" y="176" width="4" height="12"/><rect class="wf-m wf-dk" x="132" y="176" width="4" height="12"/>'
            '<rect x="44" y="120" width="12" height="16" rx="2" fill="#f4f2ec"/><path d="M50 122c-9-14-16-10-14-22 8 2 12 8 14 18 2-12 8-18 15-18 1 10-6 16-15 22z" fill="#5e7a64"/>'
            '<rect x="112" y="104" width="3" height="32" fill="#2b2b2b"/><path d="M100 104h27l-6-18h-15z" fill="#f3ead8"/>'
            '<rect class="wf-s wf-dk" x="196" y="118" width="170" height="52" rx="10"/><rect class="wf-s" x="186" y="142" width="190" height="42" rx="10"/>'
            '<rect class="wf-s wf-lt" x="204" y="140" width="76" height="22" rx="7"/><rect class="wf-s wf-lt" x="284" y="140" width="76" height="22" rx="7"/>'
            '<rect class="wf-a" x="208" y="122" width="30" height="24" rx="6"/><rect x="326" y="122" width="30" height="24" rx="6" fill="#f4f2ec"/>'
            '<rect x="198" y="184" width="5" height="9" fill="#2b2b2b"/><rect x="359" y="184" width="5" height="9" fill="#2b2b2b"/>'
            '<rect class="wf-m" x="226" y="200" width="88" height="9" rx="3"/><rect class="wf-m wf-dk" x="234" y="209" width="4" height="15"/><rect class="wf-m wf-dk" x="302" y="209" width="4" height="15"/>'
            '</svg></div>') % (d['farben'][0][1], f, s, m, d['akzent'][1], e(was))


def foto(d):
    """True, wenn im Ausgabe-Ordner Foto und Wandmaske liegen: assets/wf-<slug>.jpg und assets/wf-<slug>-maske.png (flach in assets/, sonst greift die KI-Kennzeichnung aus site.js nicht)."""
    a = AUS / 'assets'
    return (a / ('wf-' + d['slug'] + '.jpg')).exists() and (a / ('wf-' + d['slug'] + '-maske.png')).exists()


SITZ = {'eichenboden': 'Sessel', 'grauer-boden': 'Sessel', 'roetlicher-boden': 'Sessel'}     # sonst „Sofa“
# Umfärben von Sitzmöbel und Boden: [Name, Farbe für mix-blend-mode:color (Farbton), Grau für multiply (Helligkeit)]
SITZFARBEN = [['Original', '', ''], ['Grau', '#8E9196', '#c4c4c4'], ['Beige', '#D8C7AE', '#f2f2f2'], ['Grün', '#5E7A64', '#9c9c9c'], ['Blau', '#3E5C7E', '#8c8c8c'], ['Cognac', '#A9683A', '#a6a6a6']]
BODENFARBEN = [['Original', '', ''], ['Dunkles Holz', '#5A3D2B', '#6a6a6a'], ['Grau', '#9A9A98', '#cfcfcf'], ['Rötlich', '#A8623A', '#b8b8b8']]


def hat(d, was):
    """True, wenn im Ausgabe-Ordner die Zusatzmaske assets/wf-<slug>-<was>.png liegt (was: sitz oder boden)."""
    return foto(d) and (AUS / 'assets' / ('wf-%s-%s.png' % (d['slug'], was))).exists()


def room(d):
    """Beispielzimmer als Foto. Die Wand wird im Browser eingefärbt: Farbfläche mit mix-blend-mode:multiply, begrenzt durch die Wandmaske.
    So bleiben Schatten und Licht erhalten, und beim Umschalten wischt die neue Farbe über die Wand. Ohne Foto: gezeichnetes Zimmer.
    Ebenen von unten nach oben: Foto, Wand links (.wf-lay), Wand rechts für den Vergleich (.wf-lay2), Boden und Sitzmöbel (je Farbton + Helligkeit),
    Abendlicht (.wf-eve), Vergleichsregler. Alte und neue Wandfarbe liegen als normale Flächen in EINEM multiply-Behälter, sonst stimmt die Farbe im Wisch nicht."""
    if not foto(d):
        return room_svg(d)
    was = {'moebel': 'Zimmer mit ' + d['name'], 'sofa': 'Wohnzimmer mit ' + d['name'], 'boden': 'Zimmer mit ' + d['name'], 'raum': 'Beispiel zu ' + d['name']}[d['typ']]
    extra = ''.join('<div class="wf-k wf-%s" style="--mk:url(assets/wf-%s-%s.png)"></div><div class="wf-d wf-%s" style="--mk:url(assets/wf-%s-%s.png)"></div>' % (w, d['slug'], w, w, d['slug'], w)
                    for w in ('boden', 'sitz') if hat(d, w))
    return ('<div class="wf-room wf-ph" id="wf-room" data-slug="%s" style="--w:%s;--w2:%s;--mk:url(assets/wf-%s-maske.png)">'
            '<img src="assets/wf-%s.jpg" width="1280" height="720" alt="%s. Die Wandfarbe wechselt mit den Knöpfen darunter." decoding="async">'
            '<div class="wf-lay" aria-hidden="true"><i id="wf-alt"></i><i id="wf-neu"></i></div><div class="wf-lay wf-lay2" aria-hidden="true"><i></i></div>%s'
            '<div class="wf-eve" aria-hidden="true"></div>'
            '<div class="wf-cut" hidden><span></span><input type="range" min="5" max="95" value="50" aria-label="Trennlinie zwischen den zwei Wandfarben verschieben"></div></div>'
            ) % (d['slug'], d['farben'][0][1], d['farben'][1][1], d['slug'], d['slug'], e(was), extra)


def regler(d):
    """Knöpfe unter dem Foto: Abendlicht, Vergleichen, Bild speichern, dazu Sofa- und Bodenfarben, wenn es die Masken gibt."""
    if not foto(d):
        return ''
    alle = d['farben'] + [[d['nicht'][0], d['nicht'][1], '']]
    r2 = ''.join('<button type="button" aria-pressed="%s" data-c="%s" title="%s" aria-label="Rechte Seite: %s"><i style="background:%s"></i></button>' % ('true' if i == 1 else 'false', c, e(n), e(n), c) for i, (n, c, t) in enumerate(alle))
    out = ('<div class="wf-tools"><button type="button" id="wf-eveb" aria-pressed="false">Abendlicht</button>'
           '<button type="button" id="wf-cmpb" aria-pressed="false">Zwei Farben vergleichen</button>'
           '<button type="button" id="wf-save">Bild speichern</button></div>'
           '<div class="wf-r2" id="wf-r2" hidden><span>Rechte Seite:</span><div class="wf-dots" role="group" aria-label="Wandfarbe für die rechte Seite">%s</div></div>') % r2
    for w, name, farben in (('sitz', SITZ.get(d['slug'], 'Sofa'), SITZFARBEN), ('boden', 'Boden', BODENFARBEN)):
        if hat(d, w):
            out += '<div class="wf-r2"><span>%s:</span><div class="wf-ch wf-ch2" data-was="%s" role="group" aria-label="%s umfärben">%s</div></div>' % (
                name, w, name, ''.join('<button type="button" aria-pressed="%s" data-k="%s" data-d="%s">%s</button>' % ('true' if i == 0 else 'false', k, g, n) for i, (n, k, g) in enumerate(farben)))
    return out + '<p class="wf-msg" id="wf-msg" role="status"></p>'


def unterseite(d):
    key = 'wandfarbe-' + d['slug']
    title = d['h1'] + ' – Stil-Daheim'
    desc = d['antwort'].split('. ')[0] + '. Mit Beispielzimmer zum Umschalten und vier begründeten Farben.'
    meta = {'key': key, 'title': title, 'desc': desc, 'og': 'assets/farben.jpg', 'updated': STAND, 'kurz': d['antwort'], 'kurz_nach': 'oben'}
    chips = ''.join('<button type="button" aria-pressed="%s" data-c="%s" data-t="%s"><i style="background:%s"></i>%s</button>'
                    % ('true' if i == 0 else 'false', c, e(t), c, e(n)) for i, (n, c, t) in enumerate(d['farben']))
    chips += '<button type="button" class="no" aria-pressed="false" data-c="%s" data-t="%s"><i style="background:%s"></i>Lieber nicht: %s</button>' % (
        d['nicht'][1], e('So sieht es aus, wenn es nicht passt. ' + d['meiden'].split('. ')[0] + '.'), d['nicht'][1], e(d['nicht'][0]))
    cards = ''.join('<article class="wf-card"><i style="background:%s"></i><div><h3>%s</h3><small>ungefähr %s</small><p>%s</p></div></article>' % (c, e(n), c, t) for n, c, t in d['farben'])
    w = d['farben'][0]
    mid = (d['kurz'], d['fix']) if d['fix'] else ('Möbel und Boden', EICHE)
    bar = ('<div class="wf-bar" role="img" aria-label="Verteilung der Farben: 60 Prozent %s, 30 Prozent %s, 10 Prozent %s">'
           '<span style="background:%s"><b>60 %% · %s</b></span><span style="background:%s"><b>30 %%</b></span><span style="background:%s"><b>10</b></span></div>'
           % (e(w[0]), e(mid[0]), e(d['akzent'][0]), w[1], e(w[0]), mid[1], d['akzent'][1]))
    faq = ''.join('<details><summary>%s</summary><div><p>%s</p></div></details>' % (q, a) for q, a in d['faq'])
    more = ''.join('<a href="wandfarbe-%s.html"><span class="wf-du" style="--c1:%s;--c2:%s"></span><span>%s<small>%s</small></span></a>'
                   % (s, BY[s]['fix'] or EICHE, BY[s]['farben'][0][1], e(BY[s]['kurz']), e(', '.join(x[0] for x in BY[s]['farben'][:3]))) for s in d['dazu'])
    main = '''<section id="oben" class="top"><div class="wrap narrow">
  <p class="eyebrow"><a href="wandfarben.html">Welche Wandfarbe passt?</a></p>
  <h1>%(h1)s</h1>
  <p class="lede">Vier Farben, die passen, und eine, die du besser lässt. Im Beispielzimmer kannst du sie umschalten.</p>
</div></section>
<section class="band" id="zimmer"><div class="wrap narrow">
  <h2>Im Beispielzimmer ansehen.</h2>
  %(room)s
  <div class="wf-ch" id="wf-ch" role="group" aria-label="Wandfarbe im Beispielzimmer wählen">%(chips)s</div>
  <p class="wf-say" id="wf-say" aria-live="polite"><b>%(w0)s</b>%(t0)s</p>
  %(regler)s
  <p class="wf-note">%(hinw)s Farben sehen auf jedem Bildschirm etwas anders aus als an der Wand.</p>
</div></section>
<section id="farben"><div class="wrap">
  <div class="sec-h"><h2>Vier Wandfarben, die passen.</h2></div>
  <div class="wf-cards">%(cards)s</div>
</div></section>
<section class="band" id="nicht"><div class="wrap narrow">
  <h2>Lieber nicht.</h2>
  <p>%(meiden)s</p>
</div></section>
<section id="regel"><div class="wrap narrow">
  <h2>So verteilst du die Farben.</h2>
  <p>Nach der <a href="farben.html#regel">60-30-10-Regel</a> bekommt die Wandfarbe etwa 60 Prozent des Raums, die zweite Farbe 30 Prozent und ein Akzent 10 Prozent.</p>
  %(bar)s
  <ul class="wf-leg"><li><b>60 Prozent:</b> %(w0)s an den Wänden</li><li><b>30 Prozent:</b> %(mid)s</li><li><b>10 Prozent:</b> %(ak)s. %(akt)s</li></ul>
</div></section>
<section class="band" id="pruefen"><div class="wrap narrow">
  <h2>Vor dem Streichen prüfen.</h2>
  <p>%(licht)s</p>
  <p>Streiche ein Stück Karton in der Größe eines Blatts Papier und halte es an zwei Wände. Schau morgens, mittags und abends bei Lampenlicht darauf. Wie das genau geht, steht unter <a href="farben.html#testen">Vor dem Streichen testen</a>.</p>
  <p class="wf-buy">Kleine Probierdosen gibt es für wenige Euro: <a href="{{amz:Wandfarbe Tester Probierdose}}" rel="sponsored nofollow noopener" target="_blank">Probierfarben bei Amazon suchen</a> <span class="tag">Anzeige</span></p>
</div></section>
<section id="fragen"><div class="wrap narrow faq">
  <h2>Häufige Fragen.</h2>
  %(faq)s
</div></section>
<section class="band" id="weiter"><div class="wrap">
  <div class="sec-h"><h2>Ähnliche Fragen.</h2></div>
  <div class="wf-more">%(more)s</div>
  <p class="wf-also"><a href="wandfarben.html">Alle %(n)d Kombinationen</a><a href="wandfarbe-testen.html?raum=%(slug)s">Diesen Raum im Studio öffnen</a><a href="farbpalette.html">Farbpalette aus deinem Zimmerfoto</a><a href="farben.html">Wandfarbe wählen und kombinieren</a></p>
  <p class="wf-note">Die Empfehlungen folgen den Regeln aus unserem Ratgeber <a href="farben.html">Wandfarbe wählen</a>: Farbkreis, 60-30-10-Regel und Lichtrichtung. Die Quellen stehen dort. Die Farbwerte sind Näherungen.</p>
</div></section>''' % dict(slug=d['slug'], hinw='Das Bild zeigt die Richtung, nicht den genauen Ton.' if foto(d) else 'Die Zeichnung zeigt die Richtung, nicht den genauen Ton.', h1=e(d['h1']), room=room(d), regler=regler(d), chips=chips, w0=e(w[0]), t0=w[2], cards=cards, meiden=d['meiden'], bar=bar, mid=e(mid[0]),
                          ak=e(d['akzent'][0]), akt=d['akzenttext'], licht=d['licht'], faq=faq, more=more, n=len(D))
    end = ROOM_JS
    (HERE / 'pages' / (key + '.html')).write_text('<!--meta %s -->\n<!--HEAD-->\n%s\n<!--MAIN-->\n%s\n<!--END-->\n%s\n' % (json.dumps(meta, ensure_ascii=False), CSS, main, end), encoding='utf-8')
    return key


def uebersicht():
    meta = {'key': 'wandfarben', 'title': 'Welche Wandfarbe passt? %d Kombinationen – Stil-Daheim' % len(D),
            'desc': 'Welche Wandfarbe passt zu Eiche, zum grauen Sofa, zu dunklem Boden oder ins Nordzimmer? %d Antworten mit Beispielzimmer zum Umschalten.' % len(D),
            'og': 'assets/farben.jpg', 'updated': STAND, 'kurz_nach': 'kombinationen',
            'kurz': 'Die Wand sollte deutlich heller oder dunkler sein als die größte Fläche davor. Farben, die dem Holz oder Sofa im Farbkreis gegenüberliegen, lassen es leuchten. Farben mit demselben Stich lassen es verschwinden. In Zimmern mit wenig Sonne helfen warme Töne, in sonnigen Zimmern kühle.'}
    fl = '<button type="button" aria-pressed="true" data-f="">Alle</button>' + ''.join('<button type="button" aria-pressed="false" data-f="%s">%s</button>' % t for t in TYP)
    cards = ''.join('<a href="wandfarbe-%s.html" data-t="%s"><span class="wf-du" style="--c1:%s;--c2:%s"></span><span>%s<small>%s</small></span></a>'
                    % (d['slug'], d['typ'], d['fix'] or EICHE, d['farben'][0][1], e(d['kurz']), e(', '.join(x[0] for x in d['farben'][:3]))) for d in D)
    main = '''<section id="oben" class="top"><div class="wrap narrow">
  <p class="eyebrow">Wandfarben</p>
  <h1>Welche Wandfarbe passt?</h1>
  <p class="lede">Wähle, was schon da ist: Möbel, Sofa, Boden oder das Licht im Zimmer. Du bekommst vier Farben, die passen, und ein Beispielzimmer zum Umschalten.</p>
  <div class="wf-fl" id="wf-fl" role="group" aria-label="Nach Art filtern">%s</div>
</div></section>
<section id="kombinationen" class="band"><div class="wrap">
  <div class="wf-hub" id="wf-hub">%s</div>
</div></section>
<section id="regeln"><div class="wrap narrow">
  <h2>Drei Regeln, die fast immer stimmen.</h2>
  <p><b>Abstand halten.</b> Die Wand sollte deutlich heller oder deutlich dunkler sein als das Sofa oder die Möbel davor. Gleiche Helligkeit lässt alles verschwimmen.</p>
  <p><b>Gegenspieler suchen.</b> Holz ist gelblich oder rötlich. Grün und Blau liegen im Farbkreis gegenüber und lassen es wärmer wirken. Gelb und Orange haben denselben Stich und machen den Raum einfarbig.</p>
  <p><b>Licht ausgleichen.</b> Zimmer nach Norden haben kühles Licht und vertragen warme Töne. Zimmer nach Süden haben warmes Licht und vertragen kühle.</p>
  <p>Die Grundlagen stehen im Ratgeber <a href="farben.html">Wandfarbe wählen und kombinieren</a>. Wenn du lieber von deinem eigenen Zimmer ausgehst: Im <a href="wandfarbe-testen.html">Wandfarben-Studio</a> wechselst du Raum, Sofa und Boden oder färbst die Wand auf deinem eigenen Foto ein. Die <a href="farbpalette.html">Farbpalette aus Foto</a> zieht die Farben aus einem Bild und schlägt Wandfarben vor.</p>
</div></section>''' % (fl, cards)
    end = '''<script>
(function(){var f=document.getElementById('wf-fl'),h=document.getElementById('wf-hub');if(!f||!h)return;
 f.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;
  [].forEach.call(f.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
  [].forEach.call(h.children,function(a){a.hidden=!!b.dataset.f&&a.dataset.t!==b.dataset.f})})})();
</script>'''
    (HERE / 'pages' / 'wandfarben.html').write_text('<!--meta %s -->\n<!--HEAD-->\n%s\n<!--MAIN-->\n%s\n<!--END-->\n%s\n' % (json.dumps(meta, ensure_ascii=False), CSS, main, end), encoding='utf-8')


# Wandfarben-Studio (studio.js auf wandfarbe-testen.html und der Startseite): kurze Raumnamen und die Reihenfolge in der Raumleiste.
# Vorn stehen die Räume, in denen sich Sofa UND Boden umfärben lassen. Neue Seite in wandfarben.json: hier einen kurzen Namen ergänzen.
STUDIO = [('graues-sofa', 'Graues Sofa'), ('beiges-sofa', 'Beiges Sofa'), ('suedzimmer', 'Sonniges Zimmer'), ('gruenes-sofa', 'Grünes Sofa'), ('braunes-ledersofa', 'Ledersofa'), ('blaues-sofa', 'Blaues Sofa'),
          ('nordzimmer', 'Zimmer nach Norden'), ('niedrige-decke', 'Niedrige Decke'), ('eiche', 'Eichenmöbel'), ('nussbaum', 'Dunkles Holz'), ('weisse-moebel', 'Weiße Möbel'), ('schwarze-moebel', 'Schwarze Möbel'),
          ('buche', 'Buchenmöbel'), ('kiefer', 'Kiefernmöbel'), ('eichenboden', 'Heller Holzboden'), ('dunkler-boden', 'Dunkler Boden'), ('grauer-boden', 'Grauer Boden'), ('roetlicher-boden', 'Rötlicher Boden'),
          ('kleine-raeume', 'Kleiner Raum'), ('flur-ohne-fenster', 'Flur ohne Fenster')]


def studio():
    """Schreibt assets/studio.json in den Ausgabe-Ordner: je Beispielraum Name, Frage, die vier passenden Farben und ob es Masken für Sitzmöbel und Boden gibt."""
    by = {d['slug']: d for d in D}
    namen = dict(STUDIO)
    hell = json.loads((HERE / 'studio-hell.json').read_text(encoding='utf-8')) if (HERE / 'studio-hell.json').exists() else {}
    folge = [s for s, _ in STUDIO if s in by] + [d['slug'] for d in D if d['slug'] not in namen]
    out = []
    for s in folge:
        d = by[s]
        if not foto(d) or not (AUS / 'assets' / ('wf-%s-k.jpg' % s)).exists():
            continue                                    # ohne Foto oder Vorschaubild kein Studio-Raum
        e = {'slug': s, 'name': namen.get(s, d['h1']), 'frage': d['h1'], 'farben': [[f[0], f[1]] for f in d['farben']]}
        h = hell.get(s, {})                             # mittlere Helligkeit von Sitzmöbel und Boden im Foto (0 bis 1), studio.js rechnet damit beim Umfärben
        if hat(d, 'sitz'):
            e['sitz'] = 1
            e['sitzname'] = SITZ.get(s, 'Sofa')
            e['hs'] = h.get('sitz', .5)
        if hat(d, 'boden'):
            e['boden'] = 1
            e['hb'] = h.get('boden', .5)
        out.append(e)
    (AUS / 'assets' / 'studio.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    return len(out)


def main():
    keys = {unterseite(d) for d in D}
    uebersicht()
    for f in (HERE / 'pages').glob('wandfarbe-*.html'):    # entfernte Kombinationen aufräumen
        if f.stem not in keys and f.stem not in FEST:
            f.unlink()
    studio()
    return len(keys)


if __name__ == '__main__':
    print('Wandfarben-Seiten:', main())
