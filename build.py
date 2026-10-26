"""Baut die Seiten von Stil-Daheim aus den Bausteinen in pages/.

Quellen (Branch quellen):  build.py, pages/*.html, draw.js, site.css, site.js
Ausgabe (Branch main):     ../stil-daheim  (oder Umgebungsvariable STIL_OUT)

Jede Quelldatei beginnt mit einem Kommentar <!--meta {json} --> (key, title, desc, og, updated)
und hat die Teile <!--HEAD--> (zusätzliches im <head>), <!--MAIN--> (Inhalt von <main>) und
<!--END--> (Skripte am Ende).

Platzhalter in den Seiten:
  {{amz:Suchbegriff}}      Amazon-Suchlink mit Partner-Tag (immer mit „Anzeige“ kennzeichnen)
  {{PALETTE:stil}}         Farbkarte eines Stils
  {{STARTS:stil}}          Die drei Startstücke eines Stils mit Amazon-Suchlinks
  {{PIC:name|Alt-Text|sizes}}  Foto aus assets/ als <picture> mit WebP und JPEG
  {{HERO:name|Alt-Text}}   großes Foto oben auf der Seite (lädt sofort)
  {{RELATED:a,b=bild,c}}   Abschnitt „Passt dazu“ mit Foto-Kacheln (Schlüssel aus GRID, Bild optional;
                           mit |plain am Ende ohne farbigen Hintergrund, wenn der Abschnitt davor schon farbig ist)
  {{TILES:a,b,c}}          nur die Foto-Kacheln
  {{STRIPS}} {{STYLES_JSON}} {{PRINT}} {{SHARE}}
Aufruf: python3 build.py            (alle Seiten)
        PREVIEW=1 python3 build.py  (Hinweis „Vorschau“ in der Fußzeile)
"""
import json, re, pathlib, urllib.parse, sys, os, shutil

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'pages'
OUT = pathlib.Path(os.environ.get('STIL_OUT') or HERE.parent / 'stil-daheim')
TAG = 'stildaheim-21'   # Tracking-ID im Amazon PartnerNet
BRAND = 'Stil-Daheim'
DOMAIN = 'https://stil-daheim.de/'
PREVIEW = os.environ.get('PREVIEW') == '1'
DEFAULT_UPDATED = '2026-10-25'

LAMP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v5"/><path d="M4.5 15.5a7.5 7.5 0 0 1 15 0z"/><path d="M9.8 18.4a2.3 2.3 0 0 0 4.4 0"/></svg>'
SUN = '<svg class="th-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>'
MOON = '<svg class="th-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
BURGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
PRINT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg>'
SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
EXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'

# Hauptnavigation (Kopfzeile) und alle Ratgeber (Menü, Fußzeile, „Passt dazu“)
NAV = [('index.html#stil-finder', 'Stil-Finder', 'finder'), ('stile.html', 'Stile', 'stile'),
       ('rechner.html', 'Raum-Rechner', 'rechner'), ('mieten.html', 'Zur Miete', 'mieten')]
# (Link, Titel, Kurztext, Schlüssel, Foto)
GRID = [('index.html#stil-finder', 'Welcher Stil passt zu mir?', 'Der Stil-Finder mit fünf Fragen', 'finder', 'start'),
        ('stile.html', 'Wohnstile im Überblick', 'Sechs Stile, jeder mit Farbkarte', 'stile', 'skandi'),
        ('vintage.html', 'Vintage einrichten', 'Fundstücke aus fünf Jahrzehnten kombinieren', 'vintage', 'vintage'),
        ('modern.html', 'Modern einrichten', 'Klar, ruhig und gut verstaut', 'modern', 'modern'),
        ('skandinavisch.html', 'Skandinavisch einrichten', 'Hell, gemütlich und praktisch', 'skandinavisch', 'skandi'),
        ('japandi.html', 'Japandi einrichten', 'Ruhig, natürlich und warm', 'japandi', 'japandi'),
        ('rechner.html', 'Raum-Rechner', 'Teppich, Vorhang, Bilder, Lampe, Farbe, Tapete', 'rechner', 'essen'),
        ('mieten.html', 'Schöner wohnen zur Miete', 'Was erlaubt ist und was ohne Bohren geht', 'mieten', 'miete')]
CUR = ' aria-current="page"'
GOAT = ("<script>\n/* Besucherzähler: GoatCounter ohne Cookies, ohne Fremdskript. Zählt Seitenaufrufe und Klicks auf Partnerlinks. */\n"
        "(function(){if(location.hostname!=='stil-daheim.de')return;var E='https://stildaheim.goatcounter.com/count';\n"
        "function send(q){var u=E+'?'+q+'&rnd='+Math.random().toString(36).slice(2);if(navigator.sendBeacon){try{if(navigator.sendBeacon(u))return}catch(e){}}new Image().src=u}\n"
        "var e=encodeURIComponent;send('p='+e(location.pathname)+'&t='+e(document.title)+'&r='+e(document.referrer));\n"
        "document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a[href*=\"amazon.de\"]');if(!a)return;var m=a.href.match(/[?&]k=([^&]+)/),l=m?decodeURIComponent(m[1].replace(/\\+/g,' ')):(a.textContent||'amazon').trim().slice(0,60);\n"
        "send('p='+e('amazon: '+l)+'&t='+e('Klick von '+location.pathname)+'&e=true')},true)})();\n</script>")

# Wohnstile: Farbkarte (Name, Farbe, Schriftfarbe), Kurzbeschreibung, drei Startstücke mit Amazon-Suchbegriff, Ziel, Foto
STYLES = [
    dict(key='vintage', name='Vintage', desc='Gebraucht, mindestens 20 Jahre alt und mit Geschichte. Teak, Messing und warme Farben.',
         pal=[('Cognac', '#8f5530', '#fff'), ('Senfgelb', '#c49a3a', '#1c1f1d'), ('Petrol', '#1f5560', '#fff'), ('Oliv', '#6d6a36', '#fff')],
         start=[('Ein Sideboard aus Teak oder Nussbaum', 'Sideboard Teak Mid Century'), ('Ein Sessel mit Samt- oder Cordbezug', 'Sessel Samt Retro'),
                ('Eine Leuchte aus Messing oder Glas', 'Tischleuchte Messing Glas')],
         href='vintage.html', img='vintage', alt='Wohnzimmer im Vintage-Stil mit Teak-Sideboard, Samtsessel und Orientteppich'),
    dict(key='modern', name='Modern', desc='Klare Linien, ruhige Farben, wenig Deko. Alles hat seinen Platz.',
         pal=[('Kreide', '#eeede9', '#1c1f1d'), ('Kiesel', '#b9b6ae', '#1c1f1d'), ('Travertin', '#d6c7ad', '#1c1f1d'), ('Graphit', '#3a3b3c', '#fff')],
         start=[('Ein Sofa mit klarer, gerader Linie', 'Sofa 3-Sitzer modern grau'), ('Ein Couchtisch aus Stein, Holz oder Glas', 'Couchtisch Travertin'),
                ('Ein großes, ruhiges Bild statt vieler kleiner', 'großes Wandbild abstrakt gerahmt')],
         href='modern.html', img='modern', alt='Modernes Wohnzimmer mit Bouclé-Sofa, Couchtisch aus Travertin und großem Bild'),
    dict(key='skandinavisch', name='Skandinavisch', desc='Hell, gemütlich und praktisch. Viel Weiß, helles Holz, weiche Stoffe.',
         pal=[('Schnee', '#f4f4f1', '#1c1f1d'), ('Birke', '#e3d3b5', '#1c1f1d'), ('Nebelblau', '#a9b7c0', '#1c1f1d'), ('Salbei', '#a3ae97', '#1c1f1d')],
         start=[('Möbel aus heller Eiche oder Birke', 'Couchtisch Eiche hell'), ('Wolldecken und ein Fell', 'Wolldecke Grobstrick'),
                ('Eine Leuchte mit Stoff- oder Papierschirm', 'Stehleuchte Stoffschirm')],
         href='skandinavisch.html', img='skandi', alt='Heller Wohnraum mit Eichenholz, Leinen und Papierleuchte'),
    dict(key='japandi', name='Japandi', desc='Japanische Ruhe trifft skandinavische Gemütlichkeit. Natur, Handwerk, viel Luft.',
         pal=[('Reispapier', '#efe8dc', '#1c1f1d'), ('Ton', '#b78c6b', '#1c1f1d'), ('Moos', '#6f7558', '#fff'), ('Tusche', '#2b2a27', '#fff')],
         start=[('Ein niedriges Sofa oder Bodenkissen', 'Bodenkissen Leinen groß'), ('Eine Papierleuchte', 'Papierleuchte Stehleuchte Reispapier'),
                ('Handgemachte Keramik', 'Keramik Vase handgemacht')],
         href='japandi.html', img='japandi', alt='Japandi-Wohnzimmer mit Papier-Stehleuchte, niedrigem Leinensofa, Juteteppich und Holzlamellen'),
    dict(key='industrial', name='Industrial', desc='Loft-Gefühl mit Stahl, Holz und Leder vor rohen Wänden.',
         pal=[('Beton', '#a7a5a0', '#1c1f1d'), ('Stahl', '#4a4f53', '#fff'), ('Rost', '#8e4b2c', '#fff'), ('Leder', '#6b4429', '#fff')],
         start=[('Ein Regal aus Stahl und Massivholz', 'Regal Metall Massivholz Industrial'), ('Ein Sessel aus Leder', 'Ledersessel cognac'),
                ('Eine Pendelleuchte aus Metall', 'Pendelleuchte Metall schwarz Industrial')],
         href='stile.html#industrial', img='industrial', alt='Loft mit Backsteinwand, Ledersessel, Couchtisch aus Altholz und Fabrikleuchten'),
    dict(key='boho', name='Boho', desc='Lässig und gesammelt: Rattan, Muster, Pflanzen und Handgemachtes.',
         pal=[('Sand', '#e2cba7', '#1c1f1d'), ('Rattan', '#c29a5b', '#1c1f1d'), ('Terrakotta', '#a8552f', '#fff'), ('Olive', '#6f6f3d', '#fff')],
         start=[('Ein Sessel aus Rattan oder Korb', 'Rattansessel'), ('Ein Teppich mit Muster', 'Kelim Teppich'),
                ('Viele Pflanzen in Körben', 'Pflanzkorb Seegras')],
         href='stile.html#boho', img='boho', alt='Boho-Wohnzimmer mit Rattansessel, Kelim-Teppich, Makramee und vielen Pflanzen'),
]
STYLE = {s['key']: s for s in STYLES}


def amz_url(q):
    return 'https://www.amazon.de/s?k=%s&amp;tag=%s' % (urllib.parse.quote_plus(q.strip()), TAG)


def amz(m):
    return amz_url(m.group(1))


_widths = {}


def widths(name):
    """Tatsächliche Breiten von assets/<name>.jpg und assets/<name>-m.jpg (für srcset)."""
    if name not in _widths:
        from PIL import Image
        _widths[name] = tuple(Image.open(OUT / 'assets' / ('%s%s.jpg' % (name, s))).size[0] for s in ('-m', ''))
    return _widths[name]


def pic(name, alt, sizes='100vw', lazy=True, extra=''):
    if not (OUT / 'assets' / (name + '.jpg')).exists():
        return ''
    wm, wl = widths(name)
    load = ' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"'
    return ('<picture><source type="image/webp" srcset="assets/%(n)s-m.webp %(wm)dw, assets/%(n)s.webp %(wl)dw" sizes="%(s)s">'
            '<img src="assets/%(n)s.jpg" srcset="assets/%(n)s-m.jpg %(wm)dw, assets/%(n)s.jpg %(wl)dw" sizes="%(s)s" alt="%(a)s"%(load)s%(x)s></picture>'
            % dict(n=name, wm=wm, wl=wl, s=sizes, a=alt, load=load, x=extra))


def palette(key, cls='palette'):
    s = STYLE[key]
    return '<div class="%s" role="list" aria-label="Farbkarte %s">%s</div>' % (cls, s['name'], ''.join(
        '<span class="chip" role="listitem"><i style="background:%s"></i><span><b>%s</b>%s</span></span>' % (h, n, h.upper()) for n, h, t in s['pal']))


def starts(key):
    s = STYLE[key]
    items = ''.join('<li><a href="%s" rel="sponsored nofollow noopener" target="_blank"><span>%s</span><em>Bei Amazon%s</em></a></li>' % (amz_url(q), t, EXT)
                    for t, q in s['start'])
    return ('<div class="starts"><p class="starts-h"><b>Damit fängst du an</b><span class="tag">Anzeige</span></p><ul>%s</ul></div>' % items)


def strips():
    out = []
    for s in STYLES:
        sw = ''.join('<i style="background:%s"></i>' % h for n, h, t in s['pal'])
        ph = pic(s['img'], '', '(max-width:640px) 72vw, (max-width:1040px) 31vw, 180px') if s.get('img') else ''
        out.append('<a class="pstrip" href="%s">%s<span class="sws" aria-hidden="true">%s</span><span class="pn"><b>%s</b><small>%s</small></span></a>'
                   % (s['href'], ('<span class="pimg">%s</span>' % ph) if ph else '', sw, s['name'], s['desc']))
    return '<div class="strips">%s</div>' % ''.join(out)


def styles_json():
    d = {}
    for s in STYLES:
        has = bool(s.get('img')) and (OUT / 'assets' / (s['img'] + '.jpg')).exists()
        d[s['key']] = {'name': s['name'], 'desc': s['desc'], 'pal': [[a, b] for a, b, c in s['pal']],
                       'start': [[t, amz_url(q).replace('&amp;', '&')] for t, q in s['start']], 'href': s['href'],
                       'img': s['img'] if has else None, 'alt': s.get('alt', '')}
    return json.dumps(d, ensure_ascii=False)


def tiles(spec):
    out = []
    for item in spec.split(','):
        k, _, img = item.partition('=')
        g = next(x for x in GRID if x[3] == k)
        img = img or g[4]
        ph = pic(img, '', '(max-width:540px) 100vw, (max-width:860px) 50vw, 380px') if img else ''
        out.append('<a href="%s">%s<b>%s</b><span>%s</span></a>' % (g[0], ('<span class="rimg">%s</span>' % ph) if ph else '', g[1], g[2]))
    return '<div class="hub rel">%s</div>' % ''.join(out)


def related(spec, plain=False):
    return ('<section%s id="weiter"><div class="wrap"><div class="sec-h"><h2>Passt dazu.</h2></div>%s</div></section>'
            % ('' if plain else ' class="band"', tiles(spec)))


def sources(m):
    """Quellenliste als aufklappbarer Block, Prüfdatum bleibt sichtbar."""
    inner = m.group(1)
    checked = re.search(r'<p[^>]*>(Geprüft am.*?)</p>', inner, re.S)
    inner = re.sub(r'<p[^>]*>Geprüft am.*?</p>', '', inner, flags=re.S).strip()
    n = inner.count('<li')
    return ('<details class="src"><summary>%s</summary>%s</details>%s' % (
        'Alle %d Quellen anzeigen' % n if n > 1 else 'Quelle anzeigen', inner,
        '<p class="src checked">%s</p>' % checked.group(1) if checked else ''))


def de_date(iso):
    y, m, d = iso.split('-')
    return '%s.%s.%s' % (d, m, y)


def read_page(src):
    t = src.read_text()
    meta = json.loads(re.search(r'<!--meta(.*?)-->', t, re.S).group(1))
    head = t.split('<!--HEAD-->')[1].split('<!--MAIN-->')[0].strip() if '<!--HEAD-->' in t else ''
    main = t.split('<!--MAIN-->')[1].split('<!--END-->')[0].strip()
    end = t.split('<!--END-->')[1].strip() if '<!--END-->' in t else ''
    meta.setdefault('updated', DEFAULT_UPDATED)
    meta['noindex'] = 'noindex' in head
    return meta, head, main, end


def page(src):
    meta, head, main, end = read_page(src)
    key = meta['key']
    path = '' if key == 'index' else src.name
    navkey = 'stile' if key in STYLE else key   # Stil-Ratgeber gehören zu „Stile“
    links = ''.join('<a href="%s"%s>%s</a>' % (h, CUR if k == navkey else '', n) for h, n, k in NAV)
    grid = ''.join('<a href="%s"%s><b>%s</b><small>%s</small></a>' % (h, CUR if k == key else '', n, s) for h, n, s, k, p in GRID)
    flinks = ''.join('<a href="%s">%s</a>' % (h, n) for h, n, s, k, p in GRID[1:])
    stand = '' if key == '404' else '<p class="stand">Stand: %s</p>' % de_date(meta['updated'])
    html = ('<!doctype html><html lang="de"><head><meta charset="utf-8">'
            '<script>try{var t=localStorage.getItem("sdth");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<title>%(title)s</title><meta name="description" content="%(desc)s">\n'
            '<meta property="og:title" content="%(title)s"><meta property="og:description" content="%(desc)s"><meta property="og:type" content="website">'
            '<meta property="og:image" content="%(dom)s%(og)s"><meta property="og:url" content="%(dom)s%(path)s"><meta property="og:locale" content="de_DE"><meta name="twitter:card" content="summary_large_image">\n'
            '<link rel="canonical" href="%(dom)s%(path)s"><meta name="theme-color" content="#f6f6f3" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#121614" media="(prefers-color-scheme: dark)">\n'
            '<link rel="preload" href="assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>'
            '<link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png">'
            '<link rel="stylesheet" href="site.css">\n%(head)s\n<script src="site.js" defer></script></head><body>\n'
            '<a class="skip" href="#main">Zum Inhalt springen</a>\n'
            '<header class="hd" id="hd"><div class="hd-in"><a class="logo" href="index.html">%(lamp)s<span>Stil-Daheim</span></a>'
            '<nav class="nav" aria-label="Hauptmenü">%(links)s</nav>'
            '<button class="ic" id="th" type="button" aria-label="Hell oder dunkel umschalten">%(sun)s%(moon)s</button>'
            '<button class="ic mb" id="mb" type="button" aria-expanded="false" aria-controls="msheet">%(burger)s<span>Menü</span></button></div></header>\n'
            '<div class="sheet-m" id="msheet" hidden role="dialog" aria-modal="true" aria-label="Menü"><div class="sheet-in">'
            '<div class="sheet-top"><b>Stil-Daheim</b><button class="ic" id="mclose" type="button" aria-label="Menü schließen">%(close)s</button></div>'
            '<div id="mtoc-wrap" hidden><p class="m-h">Auf dieser Seite</p><nav class="m-toc" id="mtoc" aria-label="Auf dieser Seite"></nav></div>'
            '<p class="m-h">Ratgeber und Rechner</p><nav class="m-grid" aria-label="Alle Ratgeber">%(grid)s</nav>'
            '<p class="m-foot"><a href="so-arbeiten-wir.html">So arbeiten wir</a> · <a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a> · Schwesterseite: <a href="https://strom-daheim.de/">Strom-Daheim</a></p></div></div>\n'
            '<main id="main">\n%(main)s\n</main>\n'
            '<footer class="ft"><div class="wrap"><p>Alle Angaben sind Richtwerte nach den genannten Quellen, ohne Gewähr. Die Raumfotos sind mit KI erzeugte Beispielbilder. '
            'Mit „Anzeige“ markierte Links sind Partnerlinks (Amazon-Partnerprogramm): Kaufst du darüber, erhalten wir eine Provision. Für dich ändert sich der Preis nicht. '
            'Als Amazon-Partner verdienen wir an qualifizierten Verkäufen.</p>%(stand)s'
            '<div class="ft-links"><span>© 2026 Stil-Daheim · Alex Noel, Leinach</span>%(flinks)s<a href="so-arbeiten-wir.html">So arbeiten wir</a><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="https://strom-daheim.de/">Schwesterseite Strom-Daheim</a></div>%(badge)s</div></footer>\n'
            '%(end)s\n%(gc)s\n</body></html>\n') % dict(badge='<span class="preview">Vorschau, noch nicht veröffentlicht</span>' if PREVIEW else '', gc=GOAT,
                                                  title=meta['title'], desc=meta['desc'], dom=DOMAIN, og=meta.get('og', 'assets/start.jpg'), stand=stand,
                                                  path=path, head=head, lamp=LAMP, links=links, sun=SUN, moon=MOON, burger=BURGER,
                                                  close=CLOSE, grid=grid, main=main, flinks=flinks, end=end)
    html = html.replace('{{PRINT}}', PRINT).replace('{{SHARE}}', SHARE).replace('{{ARROW}}', ARROW).replace('{{EXT}}', EXT)
    html = html.replace('{{STRIPS}}', strips()).replace('{{STYLES_JSON}}', styles_json())
    html = re.sub(r'\{\{PALETTE:(\w+)\}\}', lambda m: palette(m.group(1)), html)
    html = re.sub(r'\{\{STARTS:(\w+)\}\}', lambda m: starts(m.group(1)), html)
    html = re.sub(r'\{\{PIC:([^|}]+)\|([^|}]*)\|([^}]*)\}\}', lambda m: pic(m.group(1), m.group(2), m.group(3)), html)
    html = re.sub(r'\{\{HERO:([^|}]+)\|([^}]*)\}\}', lambda m: pic(m.group(1), m.group(2), '100vw', lazy=False), html)
    html = re.sub(r'\{\{RELATED:([\w,=-]+)(\|plain)?\}\}', lambda m: related(m.group(1), bool(m.group(2))), html)
    html = re.sub(r'\{\{TILES:([\w,=-]+)\}\}', lambda m: tiles(m.group(1)), html)
    html = re.sub(r'\{\{amz:(.*?)\}\}', amz, html)
    html = re.sub(r'<div class="src">(.*?)</div>', sources, html, flags=re.S)
    html = html.replace('href="index.html#', 'href="./#').replace('href="index.html"', 'href="./"')
    html = html.replace('Stil-Daheim', BRAND)
    assert '{{' not in html, (src.name, html[html.find('{{'):html.find('{{') + 60])
    if src.name == '404.html':
        html = re.sub(r'(href|src|srcset)="(?!https?:|#|/|mailto:)([^"]+)"', lambda m: '%s="/%s"' % (m.group(1), m.group(2).lstrip('./') if m.group(2) not in ('./',) else ''), html)
        html = re.sub(r'(srcset="[^"]*")', lambda m: re.sub(r'(?<=[ "])assets/', '/assets/', m.group(1)), html)
        html = html.replace('url(assets/fonts/', 'url(/assets/fonts/')
    (OUT / src.name).write_text(html)
    return meta


def sitemap(metas):
    order = ['index'] + [g[3] for g in GRID]
    ms = sorted([m for m in metas if not m['noindex']], key=lambda m: (order.index(m['key']) if m['key'] in order else 99, m['file']))
    urls = ''.join('<url><loc>%s%s</loc><lastmod>%s</lastmod></url>' % (DOMAIN, '' if m['key'] == 'index' else m['file'], m['updated']) for m in ms)
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s</urlset>\n' % urls)


if __name__ == '__main__':
    names = sys.argv[1:] or [p.name for p in sorted(SRC.glob('*.html'))]
    (OUT / 'draw.js').write_text((HERE / 'draw.js').read_text().replace('{{TAG}}', TAG))
    for f in ('site.css', 'site.js'):
        shutil.copyfile(HERE / f, OUT / f)
    (OUT / 'CNAME').write_text(DOMAIN.split('/')[2] + '\n')
    (OUT / '.nojekyll').write_text('')
    (OUT / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % DOMAIN)
    metas = []
    for n in names:
        m = page(SRC / n)
        m['file'] = n
        metas.append(m)
        print('gebaut:', n)
    if not sys.argv[1:]:
        sitemap(metas)
        print('sitemap.xml:', sum(1 for m in metas if not m['noindex']), 'Seiten')
