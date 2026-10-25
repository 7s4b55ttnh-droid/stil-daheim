"""Baut die Seiten von Stil-Daheim aus den Bausteinen in pages/.
Jede Quelldatei beginnt mit einem Kommentar <!--meta {json} --> und hat die Teile
<!--HEAD--> (zusätzliches im <head>), <!--MAIN--> (Inhalt von <main>) und <!--END--> (Skripte am Ende).
Platzhalter {{amz:Suchbegriff}} werden zu Amazon-Suchlinks mit Partner-Tag."""
import json, re, pathlib, urllib.parse, sys, os

SRC = pathlib.Path(__file__).parent / 'pages'
OUT = pathlib.Path('/home/claude/stil-daheim')
TAG = 'stildaheim-21'   # in Amazon PartnerNet als Tracking-ID anlegen
BRAND = 'Stil-Daheim'
DOMAIN = 'https://stil-daheim.de/'
PREVIEW = os.environ.get('PREVIEW') == '1'   # Vorschau-Artefakt: Hinweis in der Fußzeile

LAMP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v5"/><path d="M4.5 15.5a7.5 7.5 0 0 1 15 0z"/><path d="M9.8 18.4a2.3 2.3 0 0 0 4.4 0"/></svg>'
SUN = '<svg class="th-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>'
MOON = '<svg class="th-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
BURGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
PRINT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg>'
SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>'

NAV = [('stile.html', 'Stile', 'stile'), ('vintage.html', 'Vintage', 'vintage'), ('modern.html', 'Modern', 'modern'),
       ('rechner.html', 'Raum-Rechner', 'rechner'), ('mieten.html', 'Zur Miete', 'mieten')]
GRID = [('index.html#stil-finder', 'Welcher Stil passt zu mir?', 'Der Stil-Finder mit fünf Fragen', None),
        ('stile.html', 'Wohnstile im Überblick', 'Sechs Stile, jeder mit Farbkarte', 'stile'),
        ('vintage.html', 'Vintage einrichten', 'Fundstücke aus fünf Jahrzehnten kombinieren', 'vintage'),
        ('modern.html', 'Modern einrichten', 'Klar, ruhig und gut verstaut', 'modern'),
        ('rechner.html', 'Raum-Rechner', 'Teppich, Vorhang, Bilder, Lampe, Farbe, Tapete', 'rechner'),
        ('mieten.html', 'Schöner wohnen zur Miete', 'Was erlaubt ist und was ohne Bohren geht', 'mieten')]
CUR = ' aria-current="page"'
GOAT = ("<script>\n/* Besucherzähler: GoatCounter ohne Cookies, ohne Fremdskript. Zählt Seitenaufrufe und Klicks auf Partnerlinks. */\n"
        "(function(){if(location.hostname!=='stil-daheim.de')return;var E='https://stildaheim.goatcounter.com/count';\n"
        "function send(q){var u=E+'?'+q+'&rnd='+Math.random().toString(36).slice(2);if(navigator.sendBeacon){try{if(navigator.sendBeacon(u))return}catch(e){}}new Image().src=u}\n"
        "var e=encodeURIComponent;send('p='+e(location.pathname)+'&t='+e(document.title)+'&r='+e(document.referrer));\n"
        "document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a[href*=\"amazon.de\"]');if(!a)return;var m=a.href.match(/[?&]k=([^&]+)/),l=m?decodeURIComponent(m[1].replace(/\\+/g,' ')):(a.textContent||'amazon').trim().slice(0,60);\n"
        "send('p='+e('amazon: '+l)+'&t='+e('Klick von '+location.pathname)+'&e=true')},true)})();\n</script>")

# Wohnstile: Farbkarte (Name, Farbe, Schriftfarbe), Kurzbeschreibung, drei Startstücke, Ziel
STYLES = [
    ('vintage', 'Vintage', 'Gebraucht, mindestens 20 Jahre alt und mit Geschichte. Teak, Messing und warme Farben.',
     [('Cognac', '#8f5530', '#fff'), ('Senfgelb', '#c49a3a', '#1c1f1d'), ('Petrol', '#1f5560', '#fff'), ('Oliv', '#6d6a36', '#fff')],
     ['Ein Sideboard aus Teak oder Nussbaum', 'Ein Sessel mit Samt- oder Cordbezug', 'Eine Leuchte aus Messing oder Glas'], 'vintage.html'),
    ('modern', 'Modern', 'Klare Linien, ruhige Farben, wenig Deko. Alles hat seinen Platz.',
     [('Kreide', '#eeede9', '#1c1f1d'), ('Kiesel', '#b9b6ae', '#1c1f1d'), ('Travertin', '#d6c7ad', '#1c1f1d'), ('Graphit', '#3a3b3c', '#fff')],
     ['Ein Sofa mit klarer, gerader Linie', 'Ein Couchtisch aus Stein, Holz oder Glas', 'Ein großes, ruhiges Bild statt vieler kleiner'], 'modern.html'),
    ('skandinavisch', 'Skandinavisch', 'Hell, gemütlich und praktisch. Viel Weiß, helles Holz, weiche Stoffe.',
     [('Schnee', '#f4f4f1', '#1c1f1d'), ('Birke', '#e3d3b5', '#1c1f1d'), ('Nebelblau', '#a9b7c0', '#1c1f1d'), ('Salbei', '#a3ae97', '#1c1f1d')],
     ['Möbel aus heller Eiche oder Birke', 'Wolldecken und ein Fell', 'Eine Leuchte mit Stoff- oder Papierschirm'], 'stile.html#skandinavisch'),
    ('japandi', 'Japandi', 'Japanische Ruhe trifft skandinavische Gemütlichkeit. Natur, Handwerk, viel Luft.',
     [('Reispapier', '#efe8dc', '#1c1f1d'), ('Ton', '#b78c6b', '#1c1f1d'), ('Moos', '#6f7558', '#fff'), ('Tusche', '#2b2a27', '#fff')],
     ['Ein niedriges Sofa oder Bodenkissen', 'Eine Papierleuchte', 'Handgemachte Keramik'], 'stile.html#japandi'),
    ('industrial', 'Industrial', 'Loft-Gefühl mit Stahl, Holz und Leder vor rohen Wänden.',
     [('Beton', '#a7a5a0', '#1c1f1d'), ('Stahl', '#4a4f53', '#fff'), ('Rost', '#8e4b2c', '#fff'), ('Leder', '#6b4429', '#fff')],
     ['Ein Regal aus Stahl und Massivholz', 'Ein Sessel aus Leder', 'Eine Pendelleuchte aus Metall'], 'stile.html#industrial'),
    ('boho', 'Boho', 'Lässig und gesammelt: Rattan, Muster, Pflanzen und Handgemachtes.',
     [('Sand', '#e2cba7', '#1c1f1d'), ('Rattan', '#c29a5b', '#1c1f1d'), ('Terrakotta', '#a8552f', '#fff'), ('Olive', '#6f6f3d', '#fff')],
     ['Ein Sessel aus Rattan oder Korb', 'Ein Teppich mit Muster', 'Viele Pflanzen in Körben'], 'stile.html#boho'),
]


def palette(key, cls='palette'):
    s = next(x for x in STYLES if x[0] == key)
    return '<div class="%s" role="list" aria-label="Farbkarte %s">%s</div>' % (cls, s[1], ''.join(
        '<span class="chip" role="listitem"><i style="background:%s"></i><span><b>%s</b>%s</span></span>' % (h, n, h.upper()) for n, h, t in s[3]))


def strips():
    out = []
    for k, name, desc, pal, starters, href in STYLES:
        sw = ''.join('<span class="sw" style="background:%s;color:%s">%s</span>' % (h, t, n) for n, h, t in pal)
        out.append('<a class="pstrip" href="%s"><span class="sws">%s</span><span class="pn"><b>%s</b><small>%s</small></span></a>' % (href, sw, name, desc))
    return '<div class="strips">%s</div>' % ''.join(out)


def styles_json():
    return json.dumps({k: {'name': n, 'desc': d, 'pal': [[a, b] for a, b, c in p], 'start': s, 'href': h} for k, n, d, p, s, h in STYLES}, ensure_ascii=False)


def amz(m):
    q = urllib.parse.quote_plus(m.group(1).strip())
    return 'https://www.amazon.de/s?k=%s&amp;tag=%s' % (q, TAG)


def page(src):
    t = src.read_text()
    meta = json.loads(re.search(r'<!--meta(.*?)-->', t, re.S).group(1))
    head = t.split('<!--HEAD-->')[1].split('<!--MAIN-->')[0].strip() if '<!--HEAD-->' in t else ''
    main = t.split('<!--MAIN-->')[1].split('<!--END-->')[0].strip()
    end = t.split('<!--END-->')[1].strip() if '<!--END-->' in t else ''
    key = meta['key']
    path = '' if key == 'index' else src.name
    links = ''.join('<a href="%s"%s>%s</a>' % (h, CUR if k == key else '', n) for h, n, k in NAV)
    grid = ''.join('<a href="%s"%s><b>%s</b><small>%s</small></a>' % (h, CUR if k == key else '', n, s) for h, n, s, k in GRID)
    flinks = ''.join('<a href="%s">%s</a>' % (h, n) for h, n, s, k in GRID[1:])
    html = ('<!doctype html><html lang="de"><head><meta charset="utf-8">'
            '<script>try{var t=localStorage.getItem("sdth");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<title>%(title)s</title><meta name="description" content="%(desc)s">\n'
            '<meta property="og:title" content="%(title)s"><meta property="og:description" content="%(desc)s"><meta property="og:type" content="website">'
            '<meta property="og:image" content="%(dom)s%(og)s"><meta property="og:url" content="%(dom)s%(path)s"><meta name="twitter:card" content="summary_large_image">\n'
            '<link rel="canonical" href="%(dom)s%(path)s"><meta name="theme-color" content="#1e4a3d">\n'
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
            '<p class="m-h">Ratgeber und Rechner</p><nav class="m-grid" aria-label="Alle Ratgeber">%(grid)s</nav>'
            '<div id="mtoc-wrap" hidden><p class="m-h">Auf dieser Seite</p><nav class="m-toc" id="mtoc" aria-label="Auf dieser Seite"></nav></div>'
            '<p class="m-foot"><a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a> · Schwesterseite: <a href="https://strom-daheim.de/">Strom-Daheim</a></p></div></div>\n'
            '<main id="main">\n%(main)s\n</main>\n'
            '<footer class="ft"><div class="wrap"><p>Alle Angaben sind Richtwerte nach den genannten Quellen, ohne Gewähr. Mit „Anzeige“ markierte Links sind Partnerlinks '
            '(Amazon-Partnerprogramm): Kaufst du darüber, erhalten wir eine Provision. Für dich ändert sich der Preis nicht. Als Amazon-Partner verdienen wir an qualifizierten Verkäufen.</p>'
            '<div class="ft-links"><span>© 2026 Stil-Daheim · Alex Noel, Leinach</span>%(flinks)s<a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="https://strom-daheim.de/">Schwesterseite Strom-Daheim</a></div>%(badge)s</div></footer>\n'
            '%(end)s\n%(gc)s\n</body></html>\n') % dict(badge='<span class="preview">Vorschau, noch nicht veröffentlicht</span>' if PREVIEW else '', gc=GOAT,title=meta['title'], desc=meta['desc'], dom=DOMAIN, og=meta.get('og', 'assets/start.jpg'),
                                                  path=path, head=head, lamp=LAMP, links=links, sun=SUN, moon=MOON, burger=BURGER,
                                                  close=CLOSE, grid=grid, main=main, flinks=flinks, end=end)
    html = html.replace('{{PRINT}}', PRINT).replace('{{SHARE}}', SHARE).replace('{{STRIPS}}', strips()).replace('{{STYLES_JSON}}', styles_json())
    html = re.sub(r'\{\{PALETTE:(\w+)\}\}', lambda m: palette(m.group(1)), html)
    html = re.sub(r'\{\{amz:(.*?)\}\}', amz, html)
    html = html.replace('href="index.html#', 'href="./#').replace('href="index.html"', 'href="./"')
    html = html.replace('Stil-Daheim', BRAND)
    assert '{{' not in html, (src.name, html[html.find('{{'):html.find('{{') + 60])
    if src.name == '404.html':
        html = re.sub(r'(href|src|srcset)="(?!https?:|#|/|mailto:)([^"]+)"', lambda m: '%s="/%s"' % (m.group(1), m.group(2).lstrip('./') if m.group(2) not in ('./',) else ''), html)
        html = html.replace('url(assets/fonts/', 'url(/assets/fonts/')
    (OUT / src.name).write_text(html)
    return src.name


if __name__ == '__main__':
    names = sys.argv[1:] or [p.name for p in sorted(SRC.glob('*.html'))]
    (OUT / 'draw.js').write_text((SRC.parent / 'draw.js').read_text().replace('{{TAG}}', TAG))
    (OUT / 'CNAME').write_text(DOMAIN.split('/')[2] + '\n')
    (OUT / '.nojekyll').write_text('')
    (OUT / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % DOMAIN)
    urls = ['', 'stile.html', 'vintage.html', 'modern.html', 'rechner.html', 'mieten.html']
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>%s%s</loc><lastmod>2026-10-25</lastmod></url>' % (DOMAIN, u) for u in urls) + '</urlset>\n')
    for n in names:
        print('gebaut:', page(SRC / n))
