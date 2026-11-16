#!/usr/bin/env python3
"""Baut die Seiten „Welche Wandfarbe passt zu …?“ aus wandfarben.json:
pages/wandfarben.html (Übersicht) und pages/wandfarbe-<slug>.html (eine je Kombination).
build.py ruft das vor jedem Bau auf. Diese Seiten nie von Hand ändern, sondern wandfarben.json oder diese Datei.
Regeln: Die Unterseiten bekommen KEINE Kachel auf der Startseite und KEINEN Menüeintrag, nur die Übersicht steht in GRID.
Jede neue Kombination braucht vier begründete Wandfarben, eine Farbe für „Lieber nicht“, Akzent, Lichthinweis und zwei Fragen."""
import json, pathlib, html

HERE = pathlib.Path(__file__).resolve().parent
D = json.loads((HERE / 'wandfarben.json').read_text(encoding='utf-8'))['seiten']
BY = {d['slug']: d for d in D}
STAND = '2026-11-16'
TYP = [('moebel', 'Möbel'), ('sofa', 'Sofa'), ('boden', 'Boden'), ('raum', 'Raum und Licht')]
EICHE, SOFA, HOLZ = '#C9A66B', '#B9B4AA', '#C8A977'

CSS = '''<style>
.top{padding-block:calc(env(safe-area-inset-top,0px) + 120px) clamp(24px,4vw,44px)}
.top .eyebrow{font-size:.95rem;font-weight:600;color:var(--brass-t);margin:0 0 14px}.top .eyebrow a{color:inherit}
.top h1{font-size:clamp(2.2rem,5.6vw,3.7rem)}
.wf-room{margin-top:22px}
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


def e(s):
    return html.escape(s, quote=True)


def ink(hx):
    """Schriftfarbe, die auf dem Farbfeld lesbar ist."""
    r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))
    lin = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return '#1c1f1d' if .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b) > .18 else '#ffffff'


def room(d):
    """Gezeichnetes Beispielzimmer. Fest ist das, worum es auf der Seite geht (Möbel, Sofa oder Boden), die Wand wechselt per Knopf."""
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
  <p class="wf-note">Die Zeichnung zeigt die Richtung, nicht den genauen Ton. Farben sehen auf jedem Bildschirm etwas anders aus als an der Wand.</p>
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
  <p class="wf-also"><a href="wandfarben.html">Alle %(n)d Kombinationen</a><a href="farbpalette.html">Farbpalette aus deinem Zimmerfoto</a><a href="farben.html">Wandfarbe wählen und kombinieren</a></p>
  <p class="wf-note">Die Empfehlungen folgen den Regeln aus unserem Ratgeber <a href="farben.html">Wandfarbe wählen</a>: Farbkreis, 60-30-10-Regel und Lichtrichtung. Die Quellen stehen dort. Die Farbwerte sind Näherungen.</p>
</div></section>''' % dict(h1=e(d['h1']), room=room(d), chips=chips, w0=e(w[0]), t0=w[2], cards=cards, meiden=d['meiden'], bar=bar, mid=e(mid[0]),
                          ak=e(d['akzent'][0]), akt=d['akzenttext'], licht=d['licht'], faq=faq, more=more, n=len(D))
    end = '''<script>
(function(){var r=document.getElementById('wf-room'),c=document.getElementById('wf-ch'),s=document.getElementById('wf-say');if(!r||!c)return;
 c.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;
  [].forEach.call(c.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
  r.style.setProperty('--w',b.dataset.c);s.innerHTML='<b></b>';s.firstChild.textContent=b.textContent;s.appendChild(document.createTextNode(b.dataset.t))})})();
</script>'''
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
  <p>Die Grundlagen stehen im Ratgeber <a href="farben.html">Wandfarbe wählen und kombinieren</a>. Wenn du lieber von deinem eigenen Zimmer ausgehst: Die <a href="farbpalette.html">Farbpalette aus Foto</a> zieht die Farben aus einem Bild und schlägt Wandfarben vor.</p>
</div></section>''' % (fl, cards)
    end = '''<script>
(function(){var f=document.getElementById('wf-fl'),h=document.getElementById('wf-hub');if(!f||!h)return;
 f.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;
  [].forEach.call(f.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
  [].forEach.call(h.children,function(a){a.hidden=!!b.dataset.f&&a.dataset.t!==b.dataset.f})})})();
</script>'''
    (HERE / 'pages' / 'wandfarben.html').write_text('<!--meta %s -->\n<!--HEAD-->\n%s\n<!--MAIN-->\n%s\n<!--END-->\n%s\n' % (json.dumps(meta, ensure_ascii=False), CSS, main, end), encoding='utf-8')


def main():
    keys = {unterseite(d) for d in D}
    uebersicht()
    for f in (HERE / 'pages').glob('wandfarbe-*.html'):    # entfernte Kombinationen aufräumen
        if f.stem not in keys:
            f.unlink()
    return len(keys)


if __name__ == '__main__':
    print('Wandfarben-Seiten:', main())
