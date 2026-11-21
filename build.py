"""Baut die Seiten von Stil-Daheim aus den Bausteinen in pages/.

Quellen (Branch quellen):  build.py, pages/*.html, draw.js, raumplaner.js, site.css, site.js
Ausgabe (Branch main):     ../stil-daheim  (oder Umgebungsvariable STIL_OUT)

Jede Quelldatei beginnt mit einem Kommentar <!--meta {json} --> (key, title, desc, og, updated, kurz; kurz_nach = Abschnitts-ID, hinter der „Kurz gesagt“ steht)
und hat die Teile <!--HEAD--> (zusätzliches im <head>), <!--MAIN--> (Inhalt von <main>) und
<!--END--> (Skripte am Ende).

Für Suchmaschinen: title ohne „ – Stil-Daheim“ höchstens 60 Zeichen (wichtigstes Suchwort vorn), desc 120 bis 160 Zeichen.
Ist desc länger, kürzt der Build die Beschreibung im Suchergebnis auf ganze Sätze (og:description behält den vollen Text) oder
meldet einen HINWEIS. Den Tag der ersten Veröffentlichung merkt sich der Build in erstdatum.json (bitte mit einchecken).

Platzhalter in den Seiten:
  {{amz:Suchbegriff}}      Amazon-Suchlink mit Partner-Tag (immer mit „Anzeige“ kennzeichnen)
  {{otto:Suchbegriff}}     OTTO über Awin (Suche oder, mit voller otto.de-Adresse, direkt die Produktseite; immer mit „Anzeige“)
  {{awin:ID|Adresse}}      beliebiger Awin-Händler mit Programm-ID und Zielseite (immer mit „Anzeige“)
  {{PALETTE:stil}}         Farbkarte eines Stils
  {{STARTS:stil}}          Die drei Startstücke eines Stils mit Amazon-Suchlinks
  {{PIC:name|Alt-Text|sizes}}  Foto aus assets/ als <picture> mit WebP und JPEG
  {{HERO:name|Alt-Text}}   großes Foto oben auf der Seite (lädt sofort)
  {{FIG:name|Alt-Text|Bildunterschrift}}  Zusatzfoto zwischen zwei Abschnitten (assets/name.jpg und name-m.jpg, 3:2)
  {{ALLE}}                 Startseite: alle Ratgeber aus GRID mit Suchfeld und Filter (Themen in KAT)
  {{RELATED:a,b=bild,c}}   Abschnitt „Passt dazu“ mit Foto-Kacheln (Schlüssel aus GRID, Bild optional;
                           mit |plain am Ende ohne farbigen Hintergrund, wenn der Abschnitt davor schon farbig ist)
  {{TILES:a,b,c}}          nur die Foto-Kacheln
  {{STRIPS}} {{STYLES_JSON}} {{PRINT}} {{SHARE}}
  {{WOHNIDEEN}} {{WOHNIDEEN_GRID}} {{WOHNIDEEN_N}}  wohnideen.html: alle Raumfotos als Feed, Übersicht und Anzahl (siehe WOHNIDEEN weiter unten)
  {{SCHAUFENSTER}} {{SCHAUFENSTER_N}}             Startseite: Reihe mit Raumfotos, die in den Feed führen, und Anzahl aller Räume
Aufruf: python3 build.py            (alle Seiten)
        PREVIEW=1 python3 build.py  (Hinweis „Vorschau“ in der Fußzeile)
"""
import json, re, pathlib, urllib.parse, sys, os, shutil, datetime

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'pages'
OUT = pathlib.Path(os.environ.get('STIL_OUT') or HERE.parent / 'stil-daheim')
TAG = 'stildaheim-21'   # Tracking-ID im Amazon PartnerNet
BRAND = 'Stil-Daheim'
DOMAIN = 'https://stil-daheim.de/'
PREVIEW = os.environ.get('PREVIEW') == '1'
DEFAULT_UPDATED = '2026-10-25'
ERST_DATEI = HERE / 'erstdatum.json'   # Tag der ersten Veröffentlichung je Seite (für datePublished); neue Seiten trägt der Build selbst ein
ERST = json.loads(ERST_DATEI.read_text()) if ERST_DATEI.exists() else {}

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
NAV = [('wohnideen.html', 'Wohnideen', 'wohnideen'), ('index.html#stil-finder', 'Stil-Finder', 'finder'), ('stile.html', 'Stile', 'stile'), ('wandfarbe-testen.html', 'Wandfarben-Studio', 'wandfarbe-testen'), ('raumplaner.html', 'Raumplaner', 'raumplaner'),
       ('rechner.html', 'Raum-Rechner', 'rechner'), ('mieten.html', 'Zur Miete', 'mieten')]
# (Link, Titel, Kurztext, Schlüssel, Foto)
GRID = [('index.html#stil-finder', 'Welcher Stil passt zu mir?', 'Der Stil-Finder mit sechs Bildpaaren', 'finder', 'start'),
        ('wohnideen.html', 'Wohnideen zum Stöbern', 'Ein Raum pro Bildschirm, jeder mit Tipp und Farben', 'wohnideen', 'wohnzimmer'),
        ('stile.html', 'Wohnstile im Überblick', 'Sechs Stile, jeder mit Farbkarte', 'stile', 'start'),
        ('raumplaner.html', 'Raumplaner', 'Möbel verschieben, Abstände prüfen', 'raumplaner', 'raumplaner'),
        ('bilderwand.html', 'Bilderwand-Planer', 'Rahmen anordnen, Nagelpunkte messen', 'bilderwand', 'bilderwand'),
        ('farbpalette.html', 'Farbpalette aus Foto', 'Farben aus deinem Zimmerfoto ziehen', 'farbpalette', 'farbpalette'),
        ('wandfarbe-testen.html', 'Wandfarben-Studio', 'Farben, Sofa und Boden im Raum ausprobieren', 'wandfarbe-testen', 'wandfarben'),
        ('vintage.html', 'Vintage einrichten', 'Fundstücke aus fünf Jahrzehnten kombinieren', 'vintage', 'vintage'),
        ('modern.html', 'Modern einrichten', 'Klar, ruhig und gut verstaut', 'modern', 'modern'),
        ('skandinavisch.html', 'Skandinavisch einrichten', 'Hell, gemütlich und praktisch', 'skandinavisch', 'skandi'),
        ('japandi.html', 'Japandi einrichten', 'Ruhig, natürlich und warm', 'japandi', 'japandi'),
        ('industrial.html', 'Industrial einrichten', 'Loft-Gefühl mit Stahl, Holz und Leder', 'industrial', 'industrial'),
        ('boho.html', 'Boho einrichten', 'Rattan, Muster, Pflanzen und Handgemachtes', 'boho', 'boho'),
        ('kleine-raeume.html', 'Kleine Räume größer wirken lassen', '8 Tricks und eine Checkliste', 'kleine-raeume', 'kleine-raeume'),
        ('farben.html', 'Wandfarbe wählen und kombinieren', 'Wirkung, 60-30-10-Regel, Kombinierer', 'farben', 'farben'),
        ('licht.html', 'Licht planen', 'Lichtebenen, Kelvin, Lumen-Rechner', 'licht', 'licht'),
        ('schlafzimmer.html', 'Schlafzimmer einrichten', 'Abstände, Farben, Licht, Raumklima', 'schlafzimmer', 'schlafzimmer'),
        ('gemuetlich.html', 'Gemütlich im Winter', 'Licht, Textilien, Leseecke', 'gemuetlich', 'gemuetlich'),
        ('kaffee.html', 'Kaffee-Ecke einrichten', 'Maschinen-Finder, Espresso, Matcha, Kaffee-Ecke', 'kaffee', 'kaffee'),
        ('weihnachten.html', 'Weihnachtlich dekorieren', 'Ohne Kitsch, mit Holz und Licht', 'weihnachten', 'weihnachten'),
        ('tischdeko.html', 'Weihnachtliche Tischdeko', 'Festlich decken mit Maßen und Ideen', 'tischdeko', 'tischdeko'),
        ('silvester.html', 'Silvester-Tischdeko', 'Raclette-Planer, Farben, sicher bis Mitternacht', 'silvester', 'silvester'),
        ('adventskranz.html', 'Adventskranz binden', 'Frische-Check, Anleitung, sicher mit Kerzen', 'adventskranz', 'adventskranz'),
        ('geschenke.html', 'Geschenke fürs Zuhause', 'Kleine Ideen für Nikolaus und Weihnachten', 'geschenke', 'geschenke'),
        ('gaestezimmer.html', 'Gästezimmer einrichten', 'Schlafplatz für Besuch, Gäste-Planer', 'gaestezimmer', 'gaestezimmer'),
        ('vorhaenge.html', 'Vorhänge aufhängen', 'Länge, Breite, Höhe, Vorhang-Planer', 'vorhaenge', 'vorhaenge'),
        ('esszimmer.html', 'Esszimmer einrichten', 'Esstisch-Größe, Abstände, Esstisch-Rechner', 'esszimmer', 'esszimmer'),
        ('wohnzimmer.html', 'Wohnzimmer einrichten', 'Maße, Anordnung, Licht, Wohnzimmer-Check', 'wohnzimmer', 'wohnzimmer'),
        ('flur.html', 'Flur und Eingang einrichten', 'Maße, Garderobe, Licht, Flur-Check', 'flur', 'flur'),
        ('ausmisten.html', 'Wohnung ausmisten', 'Vier Kisten, Ausmist-Planer, wohin damit', 'ausmisten', 'ausmisten'),
        ('pflanzen.html', 'Zimmerpflanzen im Winter', 'Licht, Gießen, Heizungsluft, Gieß-Check', 'pflanzen', 'pflanzen'),
        ('arbeitsecke.html', 'Arbeitsecke im Wohnzimmer', 'Platz, Maße, Licht', 'arbeitsecke', 'arbeitsecke'),
        ('black-friday.html', 'Black Friday 2026', 'Clever einrichten, echte Angebote', 'black-friday', 'black-friday'),
        ('rechner.html', 'Raum-Rechner', 'Teppich, Vorhang, Couchtisch, Fernseher, Bett, Läufer', 'rechner', 'essen'),
        ('mieten.html', 'Schöner wohnen zur Miete', 'Was erlaubt ist und was ohne Bohren geht', 'mieten', 'miete'),
        ('wandfarben.html', 'Welche Wandfarbe passt?', '24 Antworten mit Beispielzimmer zum Umschalten', 'wandfarben', 'wandfarben'),
        ('lexikon.html', 'Lexikon', 'Wohn-Begriffe von Akzentfarbe bis Zonieren', 'lexikon', 'start')]
CUR = ' aria-current="page"'
GOAT = ("<script>\n/* Besucherzähler: GoatCounter ohne Cookies, ohne Fremdskript. Zählt Seitenaufrufe und Klicks auf Partnerlinks. */\n"
        "(function(){if(location.hostname!=='stil-daheim.de')return;var E='https://stildaheim.goatcounter.com/count';\n"
        "function send(q){var u=E+'?'+q+'&rnd='+Math.random().toString(36).slice(2);if(navigator.sendBeacon){try{if(navigator.sendBeacon(u))return}catch(e){}}new Image().src=u}\n"
        "var e=encodeURIComponent;send('p='+e(location.pathname)+'&t='+e(document.title)+'&r='+e(document.referrer));\n"
        "document.addEventListener('click',function(ev){var w=ev.target.closest&&ev.target.closest('a[href*=\"awin1.com\"]');if(w){send('p='+e('awin: '+w.textContent.trim().slice(0,60))+'&t='+e('Klick von '+location.pathname)+'&e=true');return}var a=ev.target.closest&&ev.target.closest('a[href*=\"amazon.de\"]');if(!a)return;var m=a.href.match(/[?&]k=([^&]+)/),l=m?decodeURIComponent(m[1].replace(/\\+/g,' ')):(a.textContent||'amazon').trim().slice(0,60);\n"
        "send('p='+e('amazon: '+l)+'&t='+e('Klick von '+location.pathname)+'&e=true')},true)})();\n</script>")

# Wohnstile: Farbkarte (Name, Farbe, Schriftfarbe), Kurzbeschreibung, drei Startstücke mit Amazon-Suchbegriff, Ziel, Foto
STYLES = [
    dict(key='vintage', name='Vintage', desc='Gebraucht, mindestens 20 Jahre alt und mit Geschichte. Teak, Messing und warme Farben.',
         pal=[('Cognac', '#8f5530', '#fff'), ('Senfgelb', '#c49a3a', '#1c1f1d'), ('Petrol', '#1f5560', '#fff'), ('Oliv', '#6d6a36', '#fff')],
         start=[('Ein Sideboard aus Teak oder Nussbaum', 'Sideboard Teak Mid Century'), ('Ein Sessel mit Samt- oder Cordbezug', 'Sessel Samt Retro'),
                ('Eine Leuchte aus Messing oder Glas', 'Tischleuchte Messing Glas')],
         href='vintage.html', img='vintage', alt='Wohnzimmer im Vintage-Stil mit Teak-Sideboard, Samtsessel und Orientteppich',
         img2='vintage-2', alt2='Teak-Sideboard aus den Sechzigern mit Messingleuchte, Keramikvasen und Plattenspieler, daneben ein Ledersessel'),
    dict(key='modern', name='Modern', desc='Klare Linien, ruhige Farben, wenig Deko. Alles hat seinen Platz.',
         pal=[('Kreide', '#eeede9', '#1c1f1d'), ('Kiesel', '#b9b6ae', '#1c1f1d'), ('Travertin', '#d6c7ad', '#1c1f1d'), ('Graphit', '#3a3b3c', '#fff')],
         start=[('Ein Sofa mit klarer, gerader Linie', 'Sofa 3-Sitzer modern grau'), ('Ein Couchtisch aus Stein, Holz oder Glas', 'Couchtisch Travertin'),
                ('Ein großes, ruhiges Bild statt vieler kleiner', 'großes Wandbild abstrakt gerahmt')],
         href='modern.html', img='modern', alt='Modernes Wohnzimmer mit Bouclé-Sofa, Couchtisch aus Travertin und großem Bild',
         img2='modern-2', alt2='Ruhige Wohnzimmerecke mit niedrigem grauem Sofa, schwarzer Stehleuchte, Steintisch und einem großen angelehnten Bild'),
    dict(key='skandinavisch', name='Skandinavisch', desc='Hell, gemütlich und praktisch. Viel Weiß, helles Holz, weiche Stoffe.',
         pal=[('Schnee', '#f4f4f1', '#1c1f1d'), ('Birke', '#e3d3b5', '#1c1f1d'), ('Nebelblau', '#a9b7c0', '#1c1f1d'), ('Salbei', '#a3ae97', '#1c1f1d')],
         start=[('Möbel aus heller Eiche oder Birke', 'Couchtisch Eiche hell'), ('Wolldecken und ein Fell', 'Wolldecke Grobstrick'),
                ('Eine Leuchte mit Stoff- oder Papierschirm', 'Stehleuchte Stoffschirm')],
         href='skandinavisch.html', img='skandi', alt='Heller Wohnraum mit Eichenholz, Leinen und Papierleuchte',
         img2='skandinavisch-2', alt2='Heller Essplatz mit Birkentisch, Holzstühlen, Schaffell und großer Papierleuchte'),
    dict(key='japandi', name='Japandi', desc='Japanische Ruhe trifft skandinavische Gemütlichkeit. Natur, Handwerk, viel Luft.',
         pal=[('Reispapier', '#efe8dc', '#1c1f1d'), ('Ton', '#b78c6b', '#1c1f1d'), ('Moos', '#6f7558', '#fff'), ('Tusche', '#2b2a27', '#fff')],
         start=[('Ein niedriges Sofa oder Bodenkissen', 'Bodenkissen Leinen groß'), ('Eine Papierleuchte', 'Papierleuchte Stehleuchte Reispapier'),
                ('Handgemachte Keramik', 'Keramik Vase handgemacht')],
         href='japandi.html', img='japandi', alt='Japandi-Wohnzimmer mit Papier-Stehleuchte, niedrigem Leinensofa, Juteteppich und Holzlamellen',
         img2='japandi-2', alt2='Niedrige Eichenbank vor beiger Wand mit Keramikschale und Vase, daneben eine runde Papierleuchte und ein Bodenkissen'),
    dict(key='industrial', name='Industrial', desc='Loft-Gefühl mit Stahl, Holz und Leder vor rohen Wänden.',
         pal=[('Beton', '#a7a5a0', '#1c1f1d'), ('Stahl', '#4a4f53', '#fff'), ('Rost', '#8e4b2c', '#fff'), ('Leder', '#6b4429', '#fff')],
         start=[('Ein Regal aus Stahl und Massivholz', 'Regal Metall Massivholz Industrial'), ('Ein Sessel aus Leder', 'Ledersessel cognac'),
                ('Eine Pendelleuchte aus Metall', 'Pendelleuchte Metall schwarz Industrial')],
         href='industrial.html', img='industrial', alt='Loft mit Backsteinwand, Ledersessel, Couchtisch aus Altholz und Fabrikleuchten',
         img2='industrial-2', alt2='Schwarzes Stahlregal mit Holzböden vor einer Ziegelwand, davor ein brauner Ledersessel und eine Stehleuchte'),
    dict(key='boho', name='Boho', desc='Lässig und gesammelt: Rattan, Muster, Pflanzen und Handgemachtes.',
         pal=[('Sand', '#e2cba7', '#1c1f1d'), ('Rattan', '#c29a5b', '#1c1f1d'), ('Terrakotta', '#a8552f', '#fff'), ('Olive', '#6f6f3d', '#fff')],
         start=[('Ein Sessel aus Rattan oder Korb', 'Rattansessel'), ('Ein Teppich mit Muster', 'Kelim Teppich'),
                ('Viele Pflanzen in Körben', 'Pflanzkorb Seegras')],
         href='boho.html', img='boho', alt='Boho-Wohnzimmer mit Rattansessel, Kelim-Teppich, Makramee und vielen Pflanzen',
         img2='boho-2', alt2='Rattansessel mit gemustertem Kissen, Makramee an der Wand, Teppiche in Schichten und viele Pflanzen'),
]
STYLE = {s['key']: s for s in STYLES}


def amz_url(q):
    return 'https://www.amazon.de/s?k=%s&amp;tag=%s' % (urllib.parse.quote_plus(q.strip()), TAG)


def amz(m):
    return amz_url(m.group(1))


# ---- Partnerlinks über Awin (seit 20.11.2026): direkt zum Händler, zusätzlich zu den Amazon-Suchen. ----
# Publisher-ID 3156925. Zugelassen: Lampenwelt 7619, teppich.de 53143, Möbel Inhofer 41312, OTTO 14336.
# Die Zeile steht automatisch unter der Einkaufsliste (class="shop") der Seiten in AWIN_SEITEN, immer mit „Anzeige“.
AWIN_ID = '3156925'
LW = lambda text, pfad: ('7619', text + ' bei Lampenwelt', 'https://www.lampenwelt.de/c/' + pfad)
TP = lambda text, pfad: ('53143', text + ' bei teppich.de', 'https://www.teppich.de/' + pfad + '/')
INH = lambda text, pfad: ('41312', text + ' bei Möbel Inhofer', 'https://www.inhofer.de/' + pfad + '/')
OTTO = lambda text, such: ('14336', text + ' bei OTTO', 'https://www.otto.de/suche/' + urllib.parse.quote(such) + '/')
_stil = [LW('Pendelleuchten', 'innenleuchten/pendelleuchten-hangelampen'), TP('Teppiche', 'teppiche'), OTTO('Sofas', 'sofa')]
AWIN_SEITEN = {
    'licht': [LW('Deckenleuchten', 'innenleuchten/deckenleuchten'), LW('Stehlampen', 'innenleuchten/stehlampen'), LW('Leuchtmittel', 'leuchtmittel')],
    'wohnzimmer': [TP('Wohnzimmer-Teppiche', 'wohnzimmer-teppiche'), LW('Stehlampen', 'innenleuchten/stehlampen'), INH('Wohnzimmer-Möbel', 'wohnen/wohnzimmer'), OTTO('Sofas', 'sofa')],
    'esszimmer': [LW('Pendelleuchten', 'innenleuchten/pendelleuchten-hangelampen'), INH('Esszimmer-Möbel', 'wohnen/esszimmer'), TP('Teppiche', 'teppiche')],
    'schlafzimmer': [INH('Betten und Matratzen', 'schlafen/betten-matratzen'), LW('Tischlampen', 'innenleuchten/tischlampen'), TP('Hochflor-Teppiche', 'hochflor-teppiche')],
    'gaestezimmer': [INH('Betten und Matratzen', 'schlafen/betten-matratzen'), LW('Tischlampen', 'innenleuchten/tischlampen')],
    'flur': [TP('Läufer', 'teppich-laeufer'), LW('Deckenleuchten', 'innenleuchten/deckenleuchten')],
    'kleine-raeume': [LW('Wandleuchten', 'innenleuchten/wandleuchten'), TP('Kleine Teppiche', 'kleine-teppiche')],
    'gemuetlich': [TP('Hochflor-Teppiche', 'hochflor-teppiche'), LW('Tischlampen', 'innenleuchten/tischlampen')],
    'arbeitsecke': [LW('Tischlampen', 'innenleuchten/tischlampen')],
    'mieten': [LW('Stehlampen', 'innenleuchten/stehlampen'), TP('Teppiche', 'teppiche')],
    'vorhaenge': [OTTO('Vorhänge', 'vorhänge')],
    'boho': _stil, 'industrial': _stil, 'japandi': _stil, 'modern': _stil, 'skandinavisch': _stil, 'vintage': _stil,
}


def awin_wandfarbe(slug):
    """Händlerlinks für die Seiten wandfarbe-<slug> (stehen unter dem Probierdosen-Hinweis)."""
    k = slug[len('wandfarbe-'):]
    sofa = {'graues-sofa': 'grau', 'beiges-sofa': 'beige', 'blaues-sofa': 'blau', 'gruenes-sofa': 'grün', 'braunes-ledersofa': 'Leder braun'}
    if k in sofa:
        return [OTTO('Sofas in ' + ('braunem Leder' if 'Leder' in sofa[k] else sofa[k].capitalize()), 'Sofa ' + sofa[k]), TP('Wohnzimmer-Teppiche', 'wohnzimmer-teppiche'), LW('Stehlampen', 'innenleuchten/stehlampen')]
    if k == 'schlafzimmer':
        return [INH('Betten und Matratzen', 'schlafen/betten-matratzen'), LW('Tischlampen', 'innenleuchten/tischlampen'), TP('Hochflor-Teppiche', 'hochflor-teppiche')]
    if k == 'kinderzimmer':
        return [TP('Kinderteppiche', 'kinderteppiche'), OTTO('Kinderzimmer-Möbel', 'kinderzimmer möbel')]
    if k == 'kueche':
        return [LW('Pendelleuchten', 'innenleuchten/pendelleuchten-hangelampen'), OTTO('Küchenregale', 'küchenregal')]
    if k == 'bad':
        return [LW('Deckenleuchten', 'innenleuchten/deckenleuchten'), OTTO('Badmöbel', 'badmöbel')]
    if k.startswith('flur'):
        return [TP('Läufer', 'teppich-laeufer'), LW('Deckenleuchten', 'innenleuchten/deckenleuchten'), OTTO('Garderoben', 'garderobe')]
    if k == 'schwarze-moebel':
        return [OTTO('Schwarze Sideboards', 'sideboard schwarz'), TP('Teppiche', 'teppiche'), LW('Stehlampen', 'innenleuchten/stehlampen')]
    if k == 'weisse-moebel':
        return [OTTO('Weiße Sideboards', 'sideboard weiß'), TP('Teppiche', 'teppiche'), LW('Stehlampen', 'innenleuchten/stehlampen')]
    if k in ('kleine-raeume', 'niedrige-decke', 'nordzimmer', 'suedzimmer'):
        return [LW('Wandleuchten', 'innenleuchten/wandleuchten'), LW('Stehlampen', 'innenleuchten/stehlampen'), TP('Teppiche', 'teppiche')]
    return [TP('Teppiche', 'teppiche'), LW('Stehlampen', 'innenleuchten/stehlampen'), OTTO('Sofas', 'sofa')]   # Holz- und Bodenseiten


def awin_url(mid, ziel):
    return 'https://www.awin1.com/cread.php?awinmid=%s&amp;awinaffid=%s&amp;ued=%s' % (mid, AWIN_ID, urllib.parse.quote(ziel, safe=''))


def otto_url(q):
    """{{otto:…}}: OTTO über Awin. Eine volle otto.de-Adresse (Produktseite) wird direkt verlinkt, sonst führt der Link zur OTTO-Suche."""
    q = q.strip()
    return awin_url('14336', q if q.startswith('https://www.otto.de/') else 'https://www.otto.de/suche/' + urllib.parse.quote(q) + '/')


# Hauptlink je Empfehlung (seit 20.11.2026): Teppiche, Leuchten und Möbel gehen direkt zum Fachhändler (höhere Provision, 30 Tage Zuordnung),
# Kleinteile bleiben bei Amazon. Entschieden wird am Suchbegriff im {{amz:…}}; Amazon steht dann als zweiter Link in der Zeile darunter.
# Die vier Muster sind die EINE Quelle der Regel: build() setzt sie auch in site.js ein (Platzhalter __AUS__ usw.), damit Rechner und Planer gleich entscheiden.
K_AUS = r'tischläufer|filzgleiter|molton|vakuum|luftbett|unterbettkommode|pflanzenlampe|unterbauleuchte|led lampe|led filament|led e27|lichterkette|kerze|dimmer|fernseher|gardinenstange|leuchtmittel|tv wandhalterung'
K_TEP = r'teppich|läufer|kelim|bettvorleger'
K_LAM = r'stehleuchte|stehlampe|pendelleuchte|tischleuchte|nachttischlampe|wandleuchte|schreibtischlampe|leselampe|papierleuchte|pilzleuchte|deckenleuchte|deckenfluter'
K_MOE = (r'sofa|sessel|\bbett\b|gästebett|esstisch|couchtisch|beistelltisch|nierentisch|sideboard|\bregal\b|wandregal|sitzbank|schreibtisch|sekretär|esszimmerstühle|barhocker|kommode|kleiderschrank|wandklapptisch'
         r'|tv-board|lowboard|nachttisch|garderobe|schuhschrank|schuhkipper|hocker|paravent|standspiegel|wandspiegel|ganzkörperspiegel|wandkonsole|\bpouf\b|bürostuhl|faltmatratze|gästematratze|servierwagen')
# Lampenwelt: Bei diesen Wörtern führt der Link zur Suche „Leuchtenart + Wort“ statt nur in die Kategorie.
LW_WORT = [['rattan', 'Rattan'], ['papier', 'Papier'], ['messing', 'Messing'], ['keramik', 'Keramik'], ['akku', 'Akku'], ['industrial', 'Industrial'], ['stoffschirm', 'Stoffschirm'], ['schwarz', 'schwarz'], ['retro', 'Retro']]
# teppich.de: erstes passendes Wort bestimmt die Zielseite (Kategorien und Suchen geprüft am 20.11.2026), sonst alle Teppiche.
TEP_ZIEL = [['läufer', 'teppich-laeufer/'], ['jute', 'search?search=Jute'], ['kurzflor', 'kurzflor-teppiche/'], ['orient', 'search?search=Orient'], ['vintage', 'search?search=Vintage'],
            ['bettvorleger', 'kleine-teppiche/'], ['rund', 'runde-teppiche/'], ['wohnzimmer', 'wohnzimmer-teppiche/'], ['woll', 'search?search=Wolle']]
_AUS, _TEP, _LAM, _MOE = (re.compile(x, re.I) for x in (K_AUS, K_TEP, K_LAM, K_MOE))


def haendler(q):
    """(Händler-ID, Name, Zielseite) für einen Amazon-Suchbegriff oder None, wenn Amazon Hauptlink bleibt. Gleiche Regel wie sdKauf() in site.js."""
    k = q.lower()
    otto = ('14336', 'OTTO', 'https://www.otto.de/suche/' + urllib.parse.quote(q.strip()) + '/')
    if _AUS.search(k):
        return None
    if _TEP.search(k):
        if re.match(r'^(teppich|läufer|runder teppich)( rund)? ?\d', k):   # nur Art und Maß („Teppich 200x300“): OTTO-Suche behält die Größe
            return otto
        T = 'https://www.teppich.de/'
        for wort, ziel in TEP_ZIEL:
            if wort in k:
                return ('53143', 'teppich.de', T + ziel)
        return ('53143', 'teppich.de', T + 'teppiche/')
    if _LAM.search(k):
        art, kat = (('Pendelleuchte', 'pendelleuchten-hangelampen') if 'pendel' in k else ('Wandleuchte', 'wandleuchten') if 'wandleuchte' in k else ('Stehleuchte', 'stehlampen') if ('stehl' in k or 'deckenfluter' in k)
                    else ('Deckenleuchte', 'deckenleuchten') if 'decken' in k else ('Tischleuchte', 'tischlampen'))
        for wort, such in LW_WORT:
            if wort in k:
                return ('7619', 'Lampenwelt', 'https://www.lampenwelt.de/catalogsearch/result/?q=' + urllib.parse.quote(art + ' ' + such))
        return ('7619', 'Lampenwelt', 'https://www.lampenwelt.de/c/innenleuchten/' + kat)
    if _MOE.search(k):
        return otto
    return None


def kauf(q):
    """(Adresse, Händlername) nach der Hauptlink-Regel: Fachhändler über Awin oder Amazon."""
    h = haendler(q)
    return (awin_url(h[0], h[2]), h[1]) if h else (amz_url(q), 'Amazon')


def awin_haupt(html):
    """Tauscht in den Einkaufslisten den Hauptlink (vor der {{amz:}}-Ersetzung aufrufen). Gibt (html, [(Titel, Amazon-Suchbegriff)]) zurück."""
    getauscht = []

    def f(m):
        h = haendler(m.group(2))
        if not h:
            return m.group(0)
        t = re.search(r'<b>(.*?)</b>', m.group(3))
        getauscht.append((t.group(1) if t else m.group(2), m.group(2)))
        return m.group(1) + awin_url(h[0], h[2]) + m.group(3) + 'Bei ' + h[1]
    html = re.sub(r'(<a class="item" href=")\{\{amz:([^}]*)\}\}("[^\n]*?<span class="go"><span>)Bei Amazon', f, html)
    if getauscht:
        html = html.replace('Die Links führen zu einer Suche bei Amazon', 'Die Links führen zu Amazon oder direkt zum Fachhändler').replace('Die Links führen zu Angeboten bei Amazon', 'Die Links führen zu Amazon oder direkt zum Fachhändler')
    return html, getauscht


def awin_zeile(html, slug, getauscht=()):
    L = AWIN_SEITEN.get(slug) or []
    A = '<a href="%s" rel="sponsored nofollow noopener" target="_blank">%s</a>'
    if slug.startswith('wandfarbe-') and slug != 'wandfarbe-testen':
        i = html.find('<p class="wf-buy">')
        if i < 0:
            return html
        j = html.find('</p>', i) + 4
        return html[:j] + '\n  <p class="aw">Passend zum Raum: %s<span class="tag">Anzeige</span></p>' % ' · '.join(A % (awin_url(m, zl), t) for m, t, zl in awin_wandfarbe(slug)) + html[j:]
    i = html.find('class="shop"')
    if getauscht and html.count('class="shop"') > 1:   # mehrere Einkaufslisten (kaffee.html): Zeile unter die Liste mit den getauschten Links
        k = html.rfind('<a class="item" href="https://www.awin1.com')
        i = html.rfind('class="shop"', 0, k) if k > 0 else i
    if (not L and not getauscht) or i < 0:
        return html
    j = html.find('</div></section>', i)
    if j < 0:
        return html
    AZ = '<a href="%s" data-amz="bleib" rel="sponsored nofollow noopener" target="_blank">%s</a>'
    z = ''
    if L:
        z += 'Lieber direkt beim Händler stöbern? ' + ' · '.join(A % (awin_url(m, zl), t) for m, t, zl in L)
    if getauscht:
        z += ('<br>' if z else '') + 'Auch bei Amazon: ' + ' · '.join(AZ % (amz_url(q), t) for t, q in list(getauscht)[:4])
    return html[:j] + '  <p class="aw">%s<span class="tag">Anzeige</span></p>\n' % z + html[j:]


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


def fig(name, alt, cap):
    """Zusatzfoto zwischen zwei Abschnitten: {{FIG:name|Alt-Text|Bildunterschrift}} (assets/<name>.jpg, 3:2)."""
    ph = pic(name, alt, '(max-width:1180px) 100vw, 1140px')
    return ('<figure class="fig">%s<figcaption>%s</figcaption></figure>' % (ph, cap)) if ph else ''


# Themen für die Filter auf der Startseite ({{ALLE}}). Neue Seite: Schlüssel hier eintragen (auch mehrere Themen, mit Leerzeichen).
KAT = {'wohnideen': 'stile', 'stile': 'stile', 'vintage': 'stile', 'modern': 'stile', 'skandinavisch': 'stile', 'japandi': 'stile', 'industrial': 'stile', 'boho': 'stile',
       'kleine-raeume': 'raum', 'wohnzimmer': 'raum', 'esszimmer': 'raum', 'gaestezimmer': 'raum saison', 'vorhaenge': 'raum licht', 'schlafzimmer': 'raum', 'flur': 'raum', 'arbeitsecke': 'raum', 'kaffee': 'raum', 'mieten': 'raum', 'ausmisten': 'raum saison',
       'farben': 'licht', 'wandfarben': 'licht', 'licht': 'licht', 'gemuetlich': 'licht saison',
       'weihnachten': 'saison', 'tischdeko': 'saison', 'adventskranz': 'saison', 'silvester': 'saison', 'geschenke': 'saison', 'black-friday': 'saison', 'pflanzen': 'saison raum',
       'rechner': 'werkzeug', 'raumplaner': 'werkzeug raum', 'bilderwand': 'werkzeug raum', 'farbpalette': 'werkzeug stile', 'wandfarbe-testen': 'werkzeug licht', 'lexikon': 'stile licht'}
FILTER = [('', 'Alle'), ('stile', 'Wohnstile'), ('raum', 'Räume'), ('licht', 'Licht und Farbe'), ('saison', 'Saison'), ('werkzeug', 'Planer und Rechner')]


def fcols(cur):
    """Fußzeile in Spalten nach Themen (seit 11.11.2026): jede Seite aus GRID landet unter ihrem ersten Thema aus KAT
    (ohne Eintrag unter „Rechner“). Neue Seiten erscheinen automatisch, sobald sie in GRID und KAT stehen."""
    cols = []
    for f, label in FILTER[1:]:
        links = ''.join('<a href="%s"%s>%s</a>' % (h, CUR if k == cur else '', n) for h, n, s, k, p in GRID
                        if (KAT.get(k, 'werkzeug').split() or ['werkzeug'])[0] == f)
        if links:
            cols.append('<div><p class="fc-h">%s</p>%s</div>' % (label, links))
    return ''.join(cols)


def thumb(name):
    """Kleines Vorschaubild assets/<name>-t.webp (560 px breit); wird beim Bauen angelegt, wenn es fehlt oder älter ist als das Foto."""
    src, dst = OUT / 'assets' / (name + '.jpg'), OUT / 'assets' / (name + '-t.webp')
    if not src.exists():
        return ''
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        from PIL import Image
        im = Image.open(src).convert('RGB')
        im.resize((560, round(im.height * 560 / im.width)), Image.LANCZOS).save(dst, quality=74, method=6)
    return 'assets/%s-t.webp' % name


# ---- WOHNIDEEN (seit 21.11.2026): alle Raumfotos als Feed zum Stöbern (wohnideen.html, wohnideen.js) und als Schaufenster auf der Startseite. ----
# Jedes Foto, das eine Seite aus GRID als {{HERO:…}} oder {{FIG:…}} zeigt, wird automatisch ein „Look“ (ein Bildschirm im Feed):
#   Tipp   = eigener Satz aus LOOK_TIPP, sonst die Bildunterschrift (FIG) oder der erste Satz von „kurz“ (HERO). Nur Fakten, die auf der Seite stehen.
#   Farben = fünf Farben aus dem Foto (gleiches Verfahren wie farbpalette.html), Namen aus FARBNAMEN (nächster Ton). Ablage: looks.json (mit einchecken).
#   Thema  = erstes Thema der Seite aus KAT (für die Filter in „Alle Räume“).
# Neue Seite mit HERO und FIG: erscheint von selbst. Fotos ohne HERO/FIG stehen in LOOK_FEST. Saison-Fotos (LOOK_ZEIT) zeigt der Feed nur in ihrer Zeit.
LOOK_AUS = {'vorher', 'wandfarben', 'black-friday', 'black-friday-2'}     # nicht im Feed: „Vorher“-Bild, Studio-Zeichnung, Aktionsbilder
# Foto: (Schlüssel der Seite in GRID, Ziel, Text des Links, Alt-Text)
LOOK_FEST = {
    'start': ('rechner', 'rechner.html', 'Zum Raum-Rechner', 'Ruhiges Wohnzimmer im Altbau im warmen Abendlicht, mit Leinensofa, Wollteppich und Pflanze'),
    'essen': ('rechner', 'rechner.html', 'Zum Raum-Rechner', 'Essecke mit rundem Eichentisch, gemischten Stühlen und einer tief hängenden Stoff-Pendelleuchte'),
    'nachher': ('licht', 'licht.html', '', 'Wohnzimmer mit drei warmen Leuchten, großem Teppich, bodenlangen Vorhängen, Kissen und Pflanzen'),
    'kaffee': ('kaffee', 'kaffee.html', 'Zum Kaffee-Ratgeber', 'Nahaufnahme: Ein Tropfen Espresso hängt über einer randvollen Tasse Kaffee, Dampf steigt im warmen Morgenlicht auf'),
    'matcha': ('kaffee', 'kaffee.html#matcha', 'Zum Matcha im Kaffee-Ratgeber', 'Aufgeschäumte Milch fließt in eine dunkle Keramikschale mit grünem Matcha, daneben Bambusbesen und Löffel'),
    'miete': ('mieten', 'mieten.html', '', 'Kleine Mietwohnung, eingerichtet ohne Bohren: angelehnter Spiegel, Bilder auf einer Leiste, Wandleuchte mit Stoffkabel'),
    'modern': ('modern', 'modern.html', '', 'Modernes Wohnzimmer mit niedrigem grauem Bouclé-Sofa, Couchtisch aus Travertin, großem abstraktem Bild und schwarzer Stehleuchte'),
    'vintage': ('vintage', 'vintage.html', '', 'Wohnzimmer im Vintage-Stil mit Teak-Sideboard, Samtsessel, Orientteppich, Messing-Stehleuchte und Plattenspieler'),
}
LOOK_TIPP = {
    'start': 'Der Teppich sollte 30 bis 50&nbsp;cm breiter sein als das Sofa.',
    'essen': 'Die Leuchte hängt 60 bis 80&nbsp;cm über der Tischplatte.',
    'nachher': 'Drei warme Leuchten auf verschiedenen Höhen statt einer kalten Birne an der Decke.',
    'kaffee': 'Für einen klassischen Espresso reichen rund 7&nbsp;Gramm Kaffee, 9&nbsp;bar und 25&nbsp;Sekunden.',
    'matcha': 'Matcha schlägst du mit 75 bis 80&nbsp;Grad heißem Wasser auf. Kochendes Wasser macht ihn bitter.',
    'miete': 'Zur Miete darfst du streichen, auch farbig. Kräftige Farben müssen beim Auszug wieder neutral sein.',
    'adventskranz': 'Für einen selbst gebundenen Kranz reichen ein Strohrohling, Wickeldraht, Nadelgrün und vier Kerzen.',
    'arbeitsecke': 'Stell die Arbeitsecke ans Fenster oder in eine Nische. Dann siehst du sie vom Sofa aus nicht ständig.',
    'ausmisten': 'Miste nach Kategorien aus statt nach Zimmern: zuerst Kleidung, Erinnerungsstücke zuletzt.',
    'bilderwand': 'Die Mitte einer Bilderwand hängt auf etwa 140 bis 150&nbsp;cm Höhe.',
    'boho': 'Höchstens drei bis vier Farben pro Raum. So bleibt Boho lässig und wird nicht chaotisch.',
    'esszimmer': 'Rechne am Esstisch mit 60&nbsp;cm Tischkante pro Person.',
    'farben': '60&nbsp;% Hauptfarbe, 30&nbsp;% Nebenfarbe, 10&nbsp;% Akzent: Die 60-30-10-Regel hält Farben im Gleichgewicht.',
    'farbpalette': 'Die fünf wichtigsten Farben deines Zimmers stecken in einem Foto. Das Werkzeug zieht sie heraus.',
    'flur': 'Im Flur bleiben etwa 90&nbsp;cm Durchgang frei. Alles darüber darf Möbeltiefe werden.',
    'gaestezimmer': 'Das Gästebett sollte rund 20&nbsp;cm länger sein als der größte Gast.',
    'gemuetlich': 'Mehrere warme Lichtquellen um 2.700&nbsp;Kelvin statt einer hellen Deckenlampe: So wird es gemütlich.',
    'geschenke': 'Gute Geschenke fürs Zuhause werden täglich benutzt: Kerze, Decke, Tasse, Pflanze oder ein schönes Licht.',
    'industrial': 'Metall, rohes Holz, Leder und Backstein. Stoffe und warmes Licht machen den Loft-Stil wohnlich.',
    'japandi': 'Niedrige Möbel, Naturmaterialien, Erdtöne und wenige Dinge: Das ist Japandi.',
    'kleine-raeume': 'Große Spiegel und Möbel auf Beinen lassen kleine Räume größer wirken.',
    'licht': 'Plane Licht in drei Ebenen: Grundlicht, Arbeitslicht und Akzentlicht für die Stimmung.',
    'modern': 'Wenige gute Stücke, geschlossener Stauraum und ein warmer Akzent auf ruhiger Basis.',
    'pflanzen': 'Im Winter gehören Zimmerpflanzen nah ans Fenster. Gegossen wird erst, wenn die Erde trocken ist.',
    'raumplaner': '70&nbsp;cm für Laufwege, 40 bis 50&nbsp;cm zwischen Sofa und Couchtisch.',
    'schlafzimmer': 'Neben dem Bett und vor dem Schrank etwa 80&nbsp;cm Platz, dazu ruhige Farben und warmweißes Licht.',
    'silvester': 'Für Raclette rechnest du etwa 200&nbsp;g Käse und 200&nbsp;g Kartoffeln pro Person.',
    'skandi': 'Helle Wände, helles Holz, Stoffe in Schichten und warmweißes Licht: So geht skandinavisch.',
    'tischdeko': 'Gestecke bleiben niedrig, damit sich am Tisch alle sehen.',
    'vintage': 'Am schönsten wirkt Vintage mit einem Hauptstück auf ruhiger Basis, gemischt mit neuen Möbeln.',
    'vorhaenge': 'Die Stange hängt etwa 15&nbsp;cm über dem Fensterrahmen und ist je Seite 15 bis 20&nbsp;cm breiter als das Fenster.',
    'weihnachten': 'Naturmaterialien, zwei bis drei Farbtöne und warmweißes Licht statt bunter Lichterketten.',
    'wohnzimmer': 'Der Couchtisch steht 40 bis 50&nbsp;cm vor dem Sofa. Für Laufwege bleiben etwa 70&nbsp;cm.',
}
# Saison: Seite -> (von, bis) als Monat-Tag. Außerhalb blendet wohnideen.js die Fotos dieser Seite aus (im Quelltext bleiben sie stehen).
LOOK_ZEIT = {'adventskranz': ('11-01', '12-24'), 'weihnachten': ('11-01', '12-26'), 'tischdeko': ('11-01', '12-26'), 'geschenke': ('11-01', '12-26'),
             'silvester': ('12-01', '01-01'), 'pflanzen': ('10-01', '03-31')}
# Kurzname der Seite für Karten (Schaufenster, „Alle Räume“); ohne Eintrag: Titel aus GRID ohne „ einrichten“.
LOOK_KURZ = {'kleine-raeume': 'Kleine Räume', 'farben': 'Wandfarbe wählen', 'mieten': 'Wohnen zur Miete', 'pflanzen': 'Zimmerpflanzen', 'arbeitsecke': 'Arbeitsecke', 'flur': 'Flur und Eingang',
             'kaffee': 'Kaffee-Ecke', 'gemuetlich': 'Gemütlich', 'weihnachten': 'Weihnachten', 'tischdeko': 'Festliche Tischdeko', 'farbpalette': 'Farbpalette', 'bilderwand': 'Bilderwand', 'geschenke': 'Geschenke'}
# Bildmitte (0 bis 1 von links) für den Hochformat-Ausschnitt (assets/<name>-h.webp); ohne Eintrag: Mitte.
LOOK_FX = {'japandi': .34, 'modern': .42, 'start': .58, 'vintage': .36, 'weihnachten': .58, 'adventskranz': .44}
# Kurze Filme über dem Standbild (kaffee-film.js): Foto -> Ausschnitt (object-position) für Bild und Film
LOOK_FILM = {'kaffee': '62% 50%', 'matcha': '58% 50%'}

FARBNAMEN = [
    ('Schnee', '#f4f4f1'), ('Kreide', '#eeede9'), ('Creme', '#f1e7d2'), ('Elfenbein', '#ece0c8'), ('Leinen', '#e6dcc8'), ('Vanille', '#f0dfb3'), ('Champagner', '#e8d5b0'), ('Mandel', '#e6c9a8'),
    ('Sand', '#d9c6a5'), ('Hafer', '#d8c8ad'), ('Düne', '#cdb891'), ('Weizen', '#dfc58f'), ('Stroh', '#dcc27a'), ('Butter', '#f0dc9c'), ('Sandstein', '#c9b08f'), ('Milchkaffee', '#b79b80'),
    ('Kamel', '#c19a6b'), ('Karamell', '#b07a45'), ('Honig', '#d49b3d'), ('Bernstein', '#c8842c'), ('Safran', '#d99b1f'), ('Gold', '#c9a24a'), ('Messing', '#a8833f'), ('Senf', '#c49a3a'), ('Ocker', '#b98a35'), ('Bronze', '#7a5a2b'),
    ('Cognac', '#8f5530'), ('Haselnuss', '#9b7048'), ('Zimt', '#a5673f'), ('Teak', '#8a5a34'), ('Tabak', '#7d5a3c'), ('Leder', '#6b4429'), ('Kastanie', '#70402a'), ('Nussbaum', '#6b4a35'), ('Walnuss', '#5e4130'), ('Zeder', '#7a4b2f'),
    ('Umbra', '#6a5644'), ('Mokka', '#4b352a'), ('Kaffee', '#4a362b'), ('Schokolade', '#3d2a20'), ('Torf', '#3a2f27'), ('Espresso', '#2b1e17'), ('Ebenholz', '#241c18'), ('Mahagoni', '#5a2a1a'), ('Olivbraun', '#5c4a24'),
    ('Terrakotta', '#a8552f'), ('Rost', '#8e4b2c'), ('Kupfer', '#b46a3c'), ('Ziegel', '#9a5136'), ('Aprikose', '#e1a36d'), ('Pfirsich', '#eab78d'), ('Koralle', '#d7735a'), ('Lachs', '#e09a80'),
    ('Weinrot', '#6e2a2a'), ('Bordeaux', '#5a2328'), ('Rosenholz', '#b98377'), ('Altrosa', '#c9a096'), ('Puder', '#e3c4b6'),
    ('Salbei', '#a3ae97'), ('Oliv', '#6d6a36'), ('Moos', '#6f7558'), ('Tanne', '#2f4f3e'), ('Flaschengrün', '#2a4034'), ('Farn', '#5d7a4f'), ('Eukalyptus', '#8fa596'), ('Pistazie', '#b7c19a'), ('Schilf', '#a8a77a'), ('Khaki', '#8a8457'),
    ('Waldgrün', '#36513f'), ('Matcha', '#a9b45c'), ('Lindgrün', '#bcc68a'),
    ('Nachtblau', '#1f2a3c'), ('Tinte', '#232c3a'), ('Petrol', '#1f5560'), ('Taubenblau', '#7d92a3'), ('Nebelblau', '#a9b7c0'), ('Stahlblau', '#51667a'), ('Rauchblau', '#6f8292'), ('Eisblau', '#cfdbe0'), ('Jeansblau', '#4e6787'),
    ('Marine', '#1d2f4a'), ('Dämmerblau', '#3d4a63'), ('Schieferblau', '#4b5968'), ('Abendblau', '#3e3a48'),
    ('Kiesel', '#b9b6ae'), ('Beton', '#a7a5a0'), ('Nebel', '#d5d5d0'), ('Silber', '#c3c4c2'), ('Zinn', '#8a8c8b'), ('Stein', '#8d8a82'), ('Schiefer', '#4a4f53'), ('Graphit', '#3a3b3c'), ('Anthrazit', '#2e3033'), ('Asche', '#6e6d6a'),
    ('Taupe', '#8b7f72'), ('Greige', '#b9aea0'), ('Rauch', '#5d5a56'), ('Tusche', '#2b2a27'), ('Kohle', '#1f1f1e'),
]


def _lab(r, g, b):
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4

    def f(t):
        return t ** (1 / 3) if t > .008856 else 7.787 * t + 16 / 116
    r, g, b = lin(r), lin(g), lin(b)
    x, y, z = f((r * .4124 + g * .3576 + b * .1805) / .95047), f(r * .2126 + g * .7152 + b * .0722), f((r * .0193 + g * .1192 + b * .9505) / 1.08883)
    return (116 * y - 16, 500 * (x - y), 200 * (y - z))


def _unlab(L, a, b):
    y = (L + 16) / 116
    x, z = a / 500 + y, y - b / 200
    g = lambda t: t ** 3 if t ** 3 > .008856 else (t - 16 / 116) / 7.787
    x, y, z = g(x) * .95047, g(y), g(z) * 1.08883
    c = lambda v: round(min(1, max(0, 12.92 * v if v <= .0031308 else 1.055 * v ** (1 / 2.4) - .055)) * 255)
    return '#%02x%02x%02x' % (c(x * 3.2406 + y * -1.5372 + z * -.4986), c(x * -.9689 + y * 1.8758 + z * .0415), c(x * .0557 + y * -.204 + z * 1.057))


def _dE(p, q):
    return ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2) ** .5


_unhex = lambda h: (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))
_NAMEN = [(n, _lab(*_unhex(h))) for n, h in FARBNAMEN]


def farbname(h, vergeben=()):
    """Name des nächstgelegenen Tons aus FARBNAMEN, der in dieser Palette noch frei ist."""
    L = _lab(*_unhex(h))
    return next(n for n, q in sorted(_NAMEN, key=lambda x: _dE(L, x[1])) if n not in vergeben)


LOOKS_DATEI = HERE / 'looks.json'   # Farben je Foto, damit der Build sie nur für neue oder geänderte Fotos rechnet
_looks_ablage = None


def look_farben(name, n=5, K=10):
    """Fünf Farben aus assets/<name>-m.jpg, hell nach dunkel: [[Name, #hex], …]. Gruppen im Lab-Farbraum wie in farbpalette.html,
    kräftige Töne zählen etwas mehr, fast schwarze Schatten weniger, sehr ähnliche Töne kommen nicht doppelt."""
    global _looks_ablage
    if _looks_ablage is None:
        _looks_ablage = json.loads(LOOKS_DATEI.read_text(encoding='utf-8')) if LOOKS_DATEI.exists() else {}
    src = OUT / 'assets' / (name + '-m.jpg')
    g = src.stat().st_size
    if _looks_ablage.get(name, {}).get('g') == g:
        return _looks_ablage[name]['p']
    from PIL import Image
    b = Image.open(src).convert('RGB').resize((64, 40), Image.LANCZOS).tobytes()
    P = [_lab(b[i], b[i + 1], b[i + 2]) for i in range(0, len(b), 3)]
    C = [P[len(P) // 2]]
    while len(C) < K:                                     # weitester Punkt als nächste Startfarbe
        C.append(max(P[::3], key=lambda p: min(_dE(p, c) for c in C)))
    for _ in range(10):
        S, N = [[0, 0, 0] for _ in C], [0] * len(C)
        for p in P:
            j = min(range(len(C)), key=lambda k: (p[0] - C[k][0]) ** 2 + (p[1] - C[k][1]) ** 2 + (p[2] - C[k][2]) ** 2)
            N[j] += 1
            S[j][0] += p[0]; S[j][1] += p[1]; S[j][2] += p[2]
        C = [(S[j][0] / N[j], S[j][1] / N[j], S[j][2] / N[j]) if N[j] else C[j] for j in range(len(C))]
    G = [[C[j], N[j]] for j in range(len(C)) if N[j]]
    weiter = True
    while weiter and len(G) > n:                          # sehr ähnliche Gruppen zusammenlegen
        weiter = False
        for j in range(len(G)):
            for k in range(j + 1, len(G)):
                if _dE(G[j][0], G[k][0]) < 9:
                    a, c = G[j], G[k]
                    t = a[1] + c[1]
                    a[0] = tuple((a[0][i] * a[1] + c[0][i] * c[1]) / t for i in range(3)); a[1] = t
                    G.pop(k); weiter = True
                    break
            if weiter:
                break
    tot = sum(x[1] for x in G)
    gew = lambda x: x[1] / tot * (1 + (x[0][1] ** 2 + x[0][2] ** 2) ** .5 / 45) * (.35 if x[0][0] < 14 else 1)
    G.sort(key=gew, reverse=True)
    out = []
    for mind in (15, 11, 7, 0):
        for x in G:
            if len(out) < n and x not in out and all(_dE(x[0], o[0]) >= mind for o in out):
                out.append(x)
    out.sort(key=lambda x: -x[0][0])
    pal, used = [], []
    for x in out:
        h = _unlab(*x[0])
        used.append(farbname(h, used))
        pal.append([used[-1], h])
    _looks_ablage[name] = {'g': g, 'p': pal}
    LOOKS_DATEI.write_text('{\n' + ',\n'.join('%s: %s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in sorted(_looks_ablage.items())) + '\n}\n', encoding='utf-8')
    return pal


def hoch(name, fx=.5):
    """Hochformat-Ausschnitt assets/<name>-h.webp (540 x 720) für Schaufenster und Bilder-Duell; fx = Bildmitte von links (0 bis 1)."""
    src, dst = OUT / 'assets' / (name + '.jpg'), OUT / 'assets' / (name + '-h.webp')
    if not src.exists():
        return ''
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:   # Bildmitte (LOOK_FX) geändert? Dann die Datei löschen, der Build legt sie neu an
        from PIL import Image
        im = Image.open(src).convert('RGB')
        w = round(im.height * 3 / 4)
        x = min(max(0, round(im.width * fx - w / 2)), im.width - w)
        im.crop((x, 0, x + w, im.height)).resize((540, 720), Image.LANCZOS).save(dst, quality=76, method=6)
    return 'assets/%s-h.webp' % name


_looks = None


def looks():
    """Alle Looks als Liste von dicts (n, key, href, label, kurz, zu, tipp, alt, kat, pal, w, h, film, zeit), in fester, gemischter Reihenfolge.
    Die Reihenfolge im Browser mischt wohnideen.js jeden Tag neu."""
    global _looks
    if _looks is not None:
        return _looks
    import hashlib, html as H
    from PIL import Image
    G = {g[3]: g for g in GRID}
    roh = {}                                               # Foto -> (Seite, Alt-Text, Bildunterschrift)

    def satz(kurz):
        t = re.sub(r'<[^>]+>', '', kurz or '')
        return re.split(r'(?<=[a-zäöüß\)])[.!?]\s+(?=[A-ZÄÖÜ])', t)[0].rstrip('.') + '.' if t else ''
    for src in sorted(SRC.glob('*.html')):
        t = src.read_text()
        m = re.search(r'<!--meta(.*?)-->', t, re.S)
        key = json.loads(m.group(1))['key'] if m else ''
        if key not in G or src.name.startswith('wandfarbe'):
            continue
        kurz = json.loads(m.group(1)).get('kurz', '')
        for name, alt in re.findall(r'\{\{HERO:([^|}]+)\|([^}]*)\}\}', t):
            roh.setdefault(name, (key, alt.strip(), satz(kurz)))
        for name, alt, cap in re.findall(r'\{\{FIG:([^|}]+)\|([^|}]*)\|([^}]*)\}\}', t):
            roh.setdefault(name, (key, alt.strip(), cap.strip()))
    for name, (key, href, zu, alt) in LOOK_FEST.items():
        roh[name] = (key, alt, roh.get(name, ('', '', ''))[2])
    L = []
    for name, (key, alt, cap) in roh.items():
        jpg = OUT / 'assets' / (name + '.jpg')
        if name in LOOK_AUS or not jpg.exists() or not (OUT / 'assets' / (name + '-m.jpg')).exists():
            continue
        g = G[key]
        fest = LOOK_FEST.get(name)
        tipp = LOOK_TIPP.get(name) or cap
        if not tipp:
            continue
        w, h = Image.open(jpg).size
        kat = [k for k in KAT.get(key, 'raum').split() if k != 'werkzeug'] or ['raum']
        art = 'Zum Planer' if 'werkzeug' in KAT.get(key, '') else 'Zum Ratgeber'
        hoch(name, LOOK_FX.get(name, .5))
        L.append(dict(n=name, key=key, href=(fest[1] if fest else g[0]), label=g[1], kurz=LOOK_KURZ.get(key, g[1].replace(' einrichten', '')),
                      zu=(fest[2] if fest and fest[2] else art), tipp=tipp, alt=H.escape(H.unescape(alt), quote=True), kat=kat[0],
                      pal=look_farben(name), w=w, h=h, film=LOOK_FILM.get(name), zeit=LOOK_ZEIT.get(key), fx=LOOK_FX.get(name, .5)))
    L.sort(key=lambda l: hashlib.md5(l['n'].encode()).hexdigest())
    for i in range(1, len(L) - 1):                         # zwei Fotos derselben Seite nicht direkt hintereinander
        if L[i]['key'] == L[i - 1]['key']:
            L[i], L[i + 1] = L[i + 1], L[i]
    _looks = L
    return L


def _mix(pal):
    return 'wandfarbe-testen.html?mix=' + ','.join(h[1:] + '-' + urllib.parse.quote(n) for n, h in pal)


def wohnideen_feed():
    """{{WOHNIDEEN}}: ein Block je Look. Bild, Tipp, Farben des Raums (Link ins Wandfarben-Studio), Link zum Ratgeber.
    Bewusst <div> statt <article id>: Das Menü sammelt Abschnitte mit id und <h2> unter „Auf dieser Seite“, hier wären das alle Räume."""
    out = []
    for l in looks():
        zeit = ' data-von="%s" data-bis="%s"' % l['zeit'] if l['zeit'] else ''
        film = ''
        if l['film']:
            film = ('<video class="kf-film" id="ed-f-%s" muted loop playsinline preload="none" aria-hidden="true" data-film="assets/%s" style="object-position:%s"></video>' % (l['n'], l['n'], l['film']))
        bild = pic(l['n'], l['alt'], '(max-aspect-ratio:4/5) 180vh, 100vw', extra=' width="%d" height="%d"%s' % (l['w'], l['h'], ' style="object-position:%s"' % l['film'] if l['film'] else ''))
        dots = ''.join('<i style="background:%s"></i>' % h for n, h in l['pal'])
        fx = ' data-fx="%s"' % l['fx'] if l['fx'] != .5 else ''
        out.append('<div class="ed-s%s" id="raum-%s" data-n="%s" data-k="%s" data-s="%s" data-p="%s"%s%s style="--c:%s">'
                   '<div class="ed-b">%s%s</div>'
                   '<div class="ed-t"><div class="wrap"><p class="ed-wo">%s</p><h2>%s</h2>'
                   '<p class="ed-l"><a class="ed-pal" href="%s" aria-label="Farben dieses Raums im Wandfarben-Studio testen"><span class="ed-dots" aria-hidden="true">%s</span>'
                   '<span class="ed-lang">Farben dieses Raums</span><span class="ed-kurz">Farben</span></a>'
                   '<a class="ed-zu" href="%s" aria-label="%s: %s">%s%s</a></p></div></div></div>'
                   % (' ed-film' if l['film'] else '', l['n'], l['n'], l['kat'], l['key'], ','.join(n + h for n, h in l['pal']), zeit, fx, l['pal'][-2][1], bild, film,
                      l['label'], l['tipp'], _mix(l['pal']), dots, l['href'], l['zu'], l['label'], l['zu'], ARROW))
    return '\n'.join(out)


def wohnideen_grid():
    """{{WOHNIDEEN_GRID}}: kleine Vorschaubilder aller Looks für „Alle Räume“."""
    return ''.join('<a href="#raum-%s" data-n="%s" data-k="%s"><img src="%s" alt="%s" width="560" height="%d" loading="lazy" decoding="async"><span>%s</span></a>'
                   % (l['n'], l['n'], l['kat'], thumb(l['n']), l['alt'], round(560 * l['h'] / l['w']), l['kurz']) for l in looks())


def looks_heute():
    """(heute, Looks, die heute in ihrer Saison sind): gleiche Regel wie im Skript von wohnideen.html."""
    try:
        from zoneinfo import ZoneInfo
        heute = datetime.datetime.now(ZoneInfo('Europe/Berlin')).date()
    except Exception:
        heute = datetime.date.today()
    md = heute.strftime('%m-%d')
    drin = lambda z: not z or ((z[0] <= md <= z[1]) if z[0] <= z[1] else (md >= z[0] or md <= z[1]))
    return heute, [l for l in looks() if drin(l['zeit'])]


def schaufenster(anzahl=16):
    """{{SCHAUFENSTER}}: Reihe mit Hochformat-Karten für die Startseite, je Seite höchstens ein Foto, Saison-Fotos nur in ihrer Zeit.
    Die Auswahl wechselt mit dem Tag des Builds, die Reihenfolge mischt das Skript der Startseite."""
    import random
    heute, L = looks_heute()
    L = [l for l in L if not l['film']]
    random.Random(heute.toordinal()).shuffle(L)
    wahl, seiten = [], set()
    for l in L:
        if l['key'] not in seiten and len(wahl) < anzahl:
            seiten.add(l['key']); wahl.append(l)
    return ''.join('<a class="sf-c" href="wohnideen.html#raum-%s"><img src="%s" alt="%s" width="540" height="720" loading="lazy" decoding="async">'
                   '<span class="sf-p" aria-hidden="true">%s</span><b>%s</b></a>'
                   % (l['n'], hoch(l['n'], l['fx']), l['alt'], ''.join('<i style="background:%s"></i>' % h for n, h in l['pal']), l['kurz']) for l in wahl)


# KAFFEE-RATGEBER (seit 21.11.2026 aus kaffee.json): eine Datei für alle Maschinen. Daraus entstehen die Karten mit Maßbild,
# die Preisklassen-Leiter, die Leiste „Unsere Wahl“, der Vergleich und alle Zahlen im Text (Anzahl, Maße von bis).
# Regeln für die Auswahl stehen in README.md unter „Kaffee-Ratgeber“. Produktfotos gibt es nicht: OTTO erlaubt nur eigenes Material
# aus dem Produktfeed. Deshalb zeichnet der Build je Gerät ein Maßbild von vorn, alle im gleichen Maßstab (Breite und Höhe laut Hersteller).
KAFFEE_DATEI = HERE / 'kaffee.json'
KF_PL = {1: 'Sehr gut', 2: 'Gut', 3: 'Okay'}
KF_ART = {'voll': 'Vollautomat', 'sieb': 'Siebträger', 'muehle': 'Mühle', 'filter': 'Filter'}
KF_ZAHL = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig']
_KF = None


def kf():
    """Daten aus kaffee.json, je Gerät ergänzt um Preisklasse (kl, 1 bis 5) und Rang nach Preis. Prüft die Regeln, damit nichts Halbes online geht."""
    global _KF
    if _KF is None:
        d = json.loads(KAFFEE_DATEI.read_text(encoding='utf-8'))
        G, K = d['geraete'], d['klassen']
        assert len({g['id'] for g in G}) == len(G), 'kaffee.json: eine id kommt doppelt vor'
        for g in G:
            g['kl'] = next((i + 1 for i, k in enumerate(K) if k['bis'] and g['preis'] < k['bis']), len(K))
            assert g['url'].startswith('https://www.otto.de/p/'), 'kaffee.json %s: url muss eine OTTO-Produktseite sein' % g['id']
            assert g['pl'] in KF_PL and g['pro'] and g['con'] and g['plsatz'], 'kaffee.json %s: Preis-Leistung, Dafür und Dagegen fehlen' % g['id']
            assert g['art'] in KF_ART and g['ort'] in ('vollautomaten', 'barista', 'filter') and g['b'] > 0 and g['h'] > 0, 'kaffee.json %s: art, ort oder Maße' % g['id']
        for i, g in enumerate(sorted(G, key=lambda g: (g['preis'], g['id']))):
            g['rang'] = i + 1
        for i in range(1, len(K) + 1):
            w = [g['id'] for g in G if g['art'] == 'voll' and g['kl'] == i and g.get('wahl')]
            assert len(w) == 1, 'kaffee.json: Preisklasse %d braucht bei den Vollautomaten genau eine „Unsere Wahl“, gefunden: %s' % (i, w)
        assert max(g['h'] for g in G) < 54, 'kaffee.json: Ein Gerät ist 54 cm oder höher. Dann stimmt der Satz „passen alle Maschinen unter den Oberschrank“ bei der Kaffee-Ecke nicht mehr (pages/kaffee.html anpassen).'
        alt = (datetime.date.today() - datetime.date.fromisoformat(d['stand'])).days
        if alt > 45:
            print('HINWEIS kaffee.json: Preise und Preisklassen zuletzt am %s geprüft (vor %d Tagen). Bitte bei OTTO neu prüfen und stand setzen.' % (de_date(d['stand']), alt))
        _KF = d
    return _KF


def kf_nb(s):
    """Festes Leerzeichen zwischen Zahl und Einheit."""
    return re.sub(r'(\d)\s(cm|mm|l|g|kg|€|bar|W|°C|ml|%)(?![\w])', r'\1&nbsp;\2', s)


def kf_de(x):
    return ('%.1f' % x).rstrip('0').rstrip('.').replace('.', ',')


def kf_klar(s):
    return re.sub(r'<[^>]+>', '', s).replace('&nbsp;', ' ')


def _kz(x):
    return ('%.1f' % x).rstrip('0').rstrip('.')


def _kr(x, y, w, h, c, rx=0):
    return '<rect class="%s" x="%s" y="%s" width="%s" height="%s"%s/>' % (c, _kz(x), _kz(y), _kz(w), _kz(h), ' rx="%s"' % _kz(rx) if rx else '')


def _kp(d, c):
    return '<path class="%s" d="%s"/>' % (c, d)


def _kc(x, y, r, c):
    return '<circle class="%s" cx="%s" cy="%s" r="%s"/>' % (c, _kz(x), _kz(y), _kz(r))


def _ktasse(cx, boden, b=21, h=15):
    o = b / 2
    return (_kp('M%s %sh%sl-2.4 %sq-.6 2.4-3 2.4h-%sq-2.4 0-3-2.4z' % (_kz(cx - o), _kz(boden - h), _kz(b), _kz(h - 2.4), _kz(b - 10.8)), 'f')
            + _kp('M%s %sq6.5 .2 6 5.2q-.5 4.2-6.6 3.6' % (_kz(cx + o - .6), _kz(boden - h + 3)), 't'))


def _kb_voll(w, h, milch, bedien):
    """Vollautomat von vorn: Gehäuse, Bedienfeld, Nische mit Auslauf und Tasse; Milch als Karaffe, Schlauch mit Behälter oder Düse."""
    o = [_kr(0, 0, w, h, 'f', min(9, w * .13)), _kp('M%s 5.5H%s' % (_kz(w * .22), _kz(w * .78)), 'd')]
    if bedien == 'touch':
        o.append(_kr(w * .2, h * .085, w * .6, h * .16, 's', 2.5))
    elif bedien == 'display':
        o.append(_kr(w * .32, h * .1, w * .36, h * .11, 's', 2))
        o += [_kc(w * x, h * .155, 1.5, 'p') for x in (.16, .24, .76, .84)]
    elif bedien == 'regler':
        o += [_kc(w * .3, h * .15, 5, 't'), _kp('M%s %sv-3.4' % (_kz(w * .3), _kz(h * .15)), 't')]
        o += [_kc(w * x, h * .15, 1.6, 'p') for x in (.52, .64, .76)]
    else:
        o += [_kc(w * x, h * .15, 1.7, 'p') for x in (.22, .36, .5, .64, .78)]
    o.append(_kp('M3 %sH%s' % (_kz(h * .255), _kz(w - 3)), 'd'))
    nx, ny, nw, nh = w * .16, h * .34, w * .68, h * .5
    bo = ny + nh
    o.append(_kr(nx, ny, nw, nh, 'n', 3))
    cx = min(nx + nw * .64, nx + nw - 18.5) if milch in ('karaffe', 'duese') else nx + nw * .5
    o += [_kr(cx - 7, ny, 14, 8.5, 'f', 2), _kp('M%s %sv3M%s %sv3' % (_kz(cx - 3), _kz(ny + 8.5), _kz(cx + 3), _kz(ny + 8.5)), 't'), _ktasse(cx, bo)]
    if milch == 'karaffe':
        kb = min(14, nw * .28)
        o += [_kr(nx + 2.5, bo - 31, kb, 31, 'g', 3), _kr(nx + 1.5, bo - 35, kb + 2, 5.5, 'f', 2), _kp('M%s %sh4v3.5' % (_kz(nx + kb + 3.5), _kz(bo - 32)), 't')]
    elif milch == 'duese':
        o += [_kp('M%s %sv%s' % (_kz(nx + 7.5), _kz(ny), _kz(nh * .42)), 't'), _kr(nx + 5.3, ny + nh * .42, 4.4, 10, 'f', 2.2)]
    elif milch == 'schlauch':
        o += [_kr(-25, h - 33, 17, 33, 'g', 3), _kp('M-25 %sh17' % _kz(h - 22), 'd'),
              _kp('M-16.5 %sC-16.5 %s %s %s %s %s' % (_kz(h - 33), _kz(ny - 10), _kz(cx - 16), _kz(ny + 22), _kz(cx - 7), _kz(ny + 5)), 'h')]
    o += [_kp('M%s %sH%s' % (_kz(nx), _kz(bo), _kz(nx + nw)), 't'), _kp('M3 %sH%s' % (_kz(h * .93), _kz(w - 3)), 'd')]
    return ''.join(o), (27 if milch == 'schlauch' else 0)


def _kb_sieb(w, h, muehle, anzeige):
    """Siebträger von vorn: oben das Bedienfeld, darunter Brühgruppe mit Siebträger, rechts die Dampflanze; mit Mühle sitzt links der Bohnenbehälter."""
    o = []
    hh = min(h * .2, 26) if muehle else 0
    if muehle:
        o += [_kp('M%s %sL%s 3.5H%sL%s %sz' % (_kz(w * .1), _kz(hh + 1), _kz(w * .13), _kz(w * .41), _kz(w * .44), _kz(hh + 1)), 'g'), _kr(w * .11, 0, w * .32, 4.5, 'f', 2)]
    bh = h - hh
    ph = bh * .3
    o += [_kr(0, hh, w, bh, 'f', 6), _kr(w * .07, hh + ph, w * .86, bh - ph - 9, 'n', 2)]
    y = hh + ph * .5
    if anzeige == 'touch':
        o.append(_kr(w * .5 - min(17, w * .2), hh + ph * .2, min(34, w * .4), ph * .62, 's', 2))
    elif anzeige == 'manometer':
        r = min(8.5, ph * .36)
        o += [_kc(w * .5, y, r, 't'), _kp('M%s %sl%s %s' % (_kz(w * .5), _kz(y), _kz(r * .55), _kz(-r * .5)), 't')]
        o += [_kc(w * x, y, 1.8, 'p') for x in (.2, .3, .7, .8)]
    else:
        o += [_kc(w * x, y, 2.4, 'p') for x in (.28, .5, .72)]
    gx, gy = w * (.6 if muehle else .5), hh + ph
    if muehle:
        o += [_kr(w * .27 - 8, gy, 16, 6, 'f', 1.5), _kp('M%s %sv7M%s %sv7' % (_kz(w * .27 - 6), _kz(gy + 6), _kz(w * .27 + 6), _kz(gy + 6)), 'd')]
    o += [_kr(gx - 10.5, gy, 21, 6.5, 'f', 1.5), _kr(gx - 12.5, gy + 6.5, 25, 5.5, 'f', 2), _kp('M%s %sl-13 9' % (_kz(gx - 12), _kz(gy + 10)), 'k'),
          _kp('M%s %sv3M%s %sv3' % (_kz(gx - 3), _kz(gy + 12), _kz(gx + 3), _kz(gy + 12)), 't'),
          _kp('M%s %sv7l4.5 %s' % (_kz(w - min(9, w * .16)), _kz(gy), _kz(min(26, bh * .28))), 'l'),
          _kr(4, h - 9, w - 8, 9, 'f', 2), _kp('M9 %sH%s' % (_kz(h - 5.2), _kz(w - 9)), 'd'), _ktasse(gx, h - 9, 17, 12.5)]
    return ''.join(o), 0


def _kb_filter(w, h):
    """Filtermaschine von vorn: links der Wassertank, rechts Filter über der Kanne."""
    cx, yt, yb, a, b = w * .64, h * .5, h - 7, w * .2, w * .23
    o = [_kr(0, h - 7, w, 7, 'f', 2.5), _kr(w * .05, h * .1, w * .27, h * .9 - 7, 'g', 3)]
    o += [_kp('M%s %sh6' % (_kz(w * .05), _kz(h * i)), 'd') for i in (.3, .45, .6)]
    o += [_kr(w * .03, h * .06, w * .31, 6, 'f', 2.5), _kp('M%s %sH%sv7' % (_kz(w * .34), _kz(h * .085), _kz(cx)), 't'), _kr(cx - w * .27, h * .17, w * .54, 5.5, 'f', 2.5),
          _kp('M%s %sH%sL%s %sH%sz' % (_kz(cx - w * .24), _kz(h * .17 + 5.5), _kz(cx + w * .24), _kz(cx + w * .11), _kz(h * .43), _kz(cx - w * .11)), 'f'),
          _kp('M%s %sL%s %sQ%s %s %s %sH%sQ%s %s %s %sL%s %sz' % (_kz(cx - a), _kz(yb), _kz(cx - b), _kz(yt + 10), _kz(cx - b), _kz(yt), _kz(cx - b + 8), _kz(yt), _kz(cx + b - 8),
                                                                    _kz(cx + b), _kz(yt), _kz(cx + b), _kz(yt + 10), _kz(cx + a), _kz(yb)), 'g'),
          _kp('M%s %sH%s' % (_kz(cx - b + .6), _kz(yt + (yb - yt) * .45), _kz(cx + b - .6)), 'd'),
          _kp('M%s %sh7q4 0 4 4v%sq0 4-4 4h-6' % (_kz(cx + b - .5), _kz(yt + 9), _kz((yb - yt) * .42)), 't'), _kr(cx - w * .13, yt - 4, w * .26, 4.5, 'f', 2)]
    return ''.join(o), 0


def _kb_muehle(w, h):
    """Kaffeemühle von vorn: Bohnenbehälter, Mahlgradring, Gehäuse mit Auffangbehälter."""
    o = [_kp('M%s 4L%s %sH%sL%s 4z' % (_kz(w * .04), _kz(w * .2), _kz(h * .33), _kz(w * .8), _kz(w * .96)), 'g'), _kr(w * .02, 0, w * .96, 4.5, 'f', 2), _kr(w * .12, h * .33, w * .76, 7, 'f', 2)]
    o += [_kp('M%s %sv3' % (_kz(w * x), _kz(h * .33 + 2)), 'd') for x in (.3, .42, .54, .66)]
    o += [_kr(w * .06, h * .33 + 7, w * .88, h * .67 - 7, 'f', 4), _kc(w * .5, h * .47, 2.6, 'p'), _kr(w * .2, h * .64, w * .6, h * .3, 'g', 3), _kr(w * .34, h * .58, w * .32, h * .06, 'f', 1.5)]
    return ''.join(o), 0


def kf_massbild(g, klein=False):
    """Maßbild als SVG: das Gerät von vorn auf der Arbeitsplatte, Breite und Höhe als Messinglinien. Alle Geräte im gleichen Maßstab
    (groß 3 px je cm, klein 2,6 px je cm ohne Maßzahlen). Die Zeichnung zeigt die Bauart, kein bestimmtes Produkt."""
    S, W, H, BASE = (2.6, 150, 130, 121) if klein else (3.0, 264, 168, 138)
    b, h, bi = g['b'], g['h'], g['bild']
    w, hp = b * 3.0, h * 3.0
    f = bi['form']
    if f == 'voll':
        inner, li = _kb_voll(w, hp, bi.get('milch', ''), bi.get('bedien', 'tasten'))
    elif f == 'sieb':
        inner, li = _kb_sieb(w, hp, bi.get('muehle', False), bi.get('bedien', 'tasten'))
    elif f == 'filter':
        inner, li = _kb_filter(w, hp)
    else:
        inner, li = _kb_muehle(w, hp)
    k = S / 3.0
    ges = (li + w) * k + (0 if klein else 58)
    x0 = (W - ges) / 2 + li * k
    y0 = BASE - hp * k
    o = ['<svg class="kf-mb%s" viewBox="0 0 %d %d" width="%d" height="%d" %s>' % (
        ' kf-mbk' if klein else '', W, H, W, H, 'aria-hidden="true"' if klein else 'role="img" aria-label="Maßbild von vorn: %s cm breit, %s cm hoch"' % (kf_de(b), kf_de(h))),
        _kp('M-900 %sH1200' % BASE, 'b'),
        '<g transform="translate(%s %s)%s">%s</g>' % (_kz(x0), _kz(y0), ' scale(%.3f)' % k if klein else '', inner)]
    if not klein:
        mx = x0 + w + 11
        o += [_kp('M%s %sH%sM%s %sv7M%s %sv7' % (_kz(x0), _kz(BASE + 10.5), _kz(x0 + w), _kz(x0), BASE + 7, _kz(x0 + w), BASE + 7), 'm'),
              '<text x="%s" y="%s" text-anchor="middle">%s cm</text>' % (_kz(x0 + w / 2), BASE + 25, kf_de(b)),
              _kp('M%s %sV%sM%s %sh7M%s %sh7' % (_kz(mx), _kz(y0), BASE, _kz(mx - 3.5), _kz(y0), _kz(mx - 3.5), BASE), 'm'),
              '<text x="%s" y="%s">%s cm</text>' % (_kz(mx + 7), _kz(y0 + hp / 2 + 4), kf_de(h))]
    return ''.join(o) + '</svg>'


def kf_eu(kl, n=5):
    return '<span class="kf-eu" aria-hidden="true">%s</span>' % ''.join('<i%s>€</i>' % (' class="an"' if i < kl else '') for i in range(n))


def kf_karte(g, h='h3'):
    """Eine Maschine: Maßbild, Einordnung, Preis-Leistung, Dafür und Dagegen, Daten zum Aufklappen, Link zu OTTO (Anzeige).
    h: Überschriftenebene des Namens (in der Preisklassen-Leiter h4, weil die Preisklasse schon h3 ist)."""
    d = kf()
    kl = d['klassen'][g['kl'] - 1]['name']
    spec = ([('B × H × T', '%s × %s × %s cm' % (kf_de(g['b']), kf_de(g['h']), kf_de(g['t'])))] if g.get('t') else []) + [tuple(s) for s in g['spec']] + [('Preisklasse', kl)]
    tags = ('<span class="kf-tipp">%s</span>' % kf_nb(g['wahl']) if g.get('wahl') else '') + '<span class="kf-tag">%s</span>' % kf_nb(g['tag'])
    test = ''
    if 'test' in g:
        t = d['test']
        test = ('<p class="kf-test">Von der %s geprüft, %s%s. <a href="%s" target="_blank" rel="noopener">Ergebnis bei test.de</a></p>'
                % (t['name'], t['kurz'], ' (%s)' % g['test'] if g['test'] else '', t['url']))
    akt = ''
    a = g.get('aktion')
    if a and datetime.date.today().isoformat() <= a['bis']:
        akt = ('<p class="kf-akt">%s <a href="{{otto:%s}}" rel="sponsored nofollow noopener" target="_blank">%s%s</a><span class="tag">Anzeige</span></p>'
               % (kf_nb(a['text']), a['url'], a['link'], EXT))
    li = lambda L: ''.join('<li>%s</li>' % kf_nb(x) for x in L)
    return ('<article class="kf-m%s" id="m-%s" data-kl="%d" data-kn="%s"><div class="kf-in">'
            '<div class="kf-bild">%s</div>'
            '<div class="kf-txt"><div class="kf-tags">%s</div><%s class="kf-n">%s</%s><p class="mod">%s</p><p class="kf-t">%s</p>'
            '<p class="kf-pl kf-pl-%d"><span>Preis-Leistung</span> <b>%s</b> <small>%s</small></p></div>'
            '<div class="kf-rest"><div class="kf-pc"><div><p class="kf-pch">Dafür</p><ul class="pro">%s</ul></div><div><p class="kf-pch">Dagegen</p><ul class="con">%s</ul></div></div>%s%s'
            '<details class="kf-dat"><summary>Technische Daten</summary><dl class="kf-spec">%s</dl></details>'
            '<div class="kf-buy"><a class="btn" href="{{otto:%s}}" rel="sponsored nofollow noopener" target="_blank">Bei OTTO ansehen%s</a><span class="tag">Anzeige</span></div></div>'
            '</div></article>'
            % (' kf-wahl' if g.get('wahl') else '', g['id'], g['kl'], kl, kf_massbild(g), tags, h, g['name'], h, '%s · %s' % (g['modell'], kl.replace(' ', '&nbsp;')) if g['art'] in ('voll', 'sieb') else g['modell'],
               kf_nb(g['text']), g['pl'], KF_PL[g['pl']], kf_nb(g['plsatz']), li(g['pro']), li(g['con']), test, akt,
               ''.join('<dt>%s</dt><dd>%s</dd>' % (a_, kf_nb(b_)) for a_, b_ in spec), g['url'], EXT))


def kf_karten(ort):
    """{{KF_KARTEN:ort}}: alle Maschinen eines Abschnitts, günstigste zuerst."""
    return '\n'.join(kf_karte(g) for g in sorted(kf()['geraete'], key=lambda g: g['rang']) if g['ort'] == ort)


def kf_leiter():
    """{{KF_LEITER}}: die Vollautomaten nach Preisklasse, in jeder Klasse zuerst „Unsere Wahl“."""
    d, out = kf(), []
    for i, k in enumerate(d['klassen']):
        G = sorted((g for g in d['geraete'] if g['art'] == 'voll' and g['kl'] == i + 1), key=lambda g: (not g.get('wahl'), g['rang']))
        out.append('<div class="kf-kl" id="k%d"><div class="kf-kl-h"><h3>%s%s</h3><p>%s</p></div><div class="kf-ms">\n%s\n</div></div>'
                   % (i + 1, kf_eu(i + 1), k['titel'], k['text'], '\n'.join(kf_karte(g, 'h4') for g in G)))
    return '\n'.join(out)


def kf_leiste():
    """{{KF_LEISTE}}: „Unsere Wahl“ der Vollautomaten je Preisklasse als kleine Maßbilder auf einer Arbeitsplatte, darunter die Preisklasse als Maßlinie."""
    d = kf()
    W = sorted((g for g in d['geraete'] if g['art'] == 'voll' and g.get('wahl')), key=lambda g: g['kl'])
    return '<ol class="kf-leiste">%s</ol>' % ''.join(
        '<li><a href="#m-%s"><span class="kf-lb">%s</span><span class="kf-lt"><span class="kf-lk">%s</span><b>%s</b><small>%s</small></span></a></li>'
        % (g['id'], kf_massbild(g, klein=True), kf_nb(d['klassen'][g['kl'] - 1]['name']), g['name'], kf_nb(g['tag'])) for g in W)


def kf_vergleich():
    """{{KF_VERGLEICH}}: Zeilen der Übersicht, günstigste zuerst, mit einer Zwischenzeile je Preisklasse (das Skript der Seite sortiert und filtert)."""
    d, out, kl = kf(), [], 0
    for g in sorted(d['geraete'], key=lambda g: g['rang']):
        if g['kl'] != kl:
            kl = g['kl']
            out.append('<tr class="kf-grp" data-g="%d"><td colspan="5">%s%s</td></tr>' % (kl, kf_eu(kl), kf_nb(d['klassen'][kl - 1]['name'])))
        m = g['milch']
        milch = '<span class="kf-mi kf-mi-%s">%s</span>' % (m, g['milchtext']) if m else '<span class="kf-leer">–</span>'
        out.append('<tr data-art="%s" data-milch="%s" data-rang="%d" data-pl="%d" data-kl="%d"><th scope="row"><a href="#m-%s">%s</a><span class="kf-va">%s</span>%s</th>'
                   '<td class="kf-vp" data-l="Preisklasse"><span class="v">%s%s</span></td><td data-l="Milch"%s><span class="v">%s</span></td>'
                   '<td data-l="Breite"><span class="v"><span class="kf-bw"><i style="width:%d%%"></i></span>%s&nbsp;cm</span></td>'
                   '<td class="kf-vr" data-l="Preis-Leistung"><span class="kf-note kf-pl-%d">%s</span></td></tr>'
                   % ({'muehle': 'zub', 'filter': 'zub'}.get(g['art'], g['art']), m or 'keine', g['rang'], g['pl'], g['kl'], g['id'], g['name'], KF_ART[g['art']],
                      '<span class="kf-vt">Unsere Wahl</span>' if g.get('wahl') else '', kf_eu(g['kl']), kf_nb(d['klassen'][g['kl'] - 1]['name']), '' if m else ' class="kf-ohne"', milch,
                      round(g['b'] / 40 * 100), kf_de(g['b']), g['pl'], KF_PL[g['pl']]))
    return '\n'.join(out)


def kf_quellen():
    """{{KF_QUELLEN}}: Quellen der Produktdaten je Gerät und zu den Testurteilen."""
    d = kf()
    A = '<a href="%s" target="_blank" rel="noopener">%s</a>'
    G = sorted(d['geraete'], key=lambda g: g['rang'])
    teil = lambda arten: '; '.join('%s %s' % (g['name'], ', '.join(A % (u, n) for n, u in g['quellen'])) for g in G if g['art'] in arten)
    st = de_date(d['stand'])
    t = d['test']
    return ('<li>Produktdaten und Preise der Vollautomaten am %s: %s</li>\n    <li>Produktdaten und Preise von Siebträgern, Mühle und Filtermaschine am %s: %s</li>\n'
            '    <li>%s: Kaffeevollautomaten im Test (%s, %d Geräte, Ergebnisse kostenpflichtig) %s</li>'
            % (st, teil(('voll',)), st, teil(('sieb', 'muehle', 'filter')), t['name'], t['datum'], t['anzahl'], A % (t['url'], 'test.de')))


def kf_zahl(key):
    """{{KF:…}}: Zahlen und Sätze, die sich aus der Geräteliste ergeben."""
    d = kf()
    G = d['geraete']
    V = [g for g in G if g['art'] == 'voll']
    von_bis = lambda L: '%s bis %s' % (kf_de(min(L)), kf_de(max(L)))
    wort = lambda n: KF_ZAHL[n] if n < len(KF_ZAHL) else str(n)
    W = sorted((g for g in V if g.get('wahl')), key=lambda g: g['kl'])
    T = [g for g in V if 'test' in g]
    Z = {
        'n': str(len(G)), 'n_voll': str(len(V)), 'n_sieb': str(sum(g['art'] == 'sieb' for g in G)), 'n_zub': str(sum(g['art'] in ('muehle', 'filter') for g in G)),
        'N_voll': wort(len(V)).capitalize(), 'N_test': wort(len(T)).capitalize(), 'n_klassen': wort(len(d['klassen'])),
        'b_voll': von_bis([g['b'] for g in V]), 'h_voll': von_bis([g['h'] for g in V]), 't_voll': von_bis([g['t'] for g in V]),
        'h_min': str(int(min(g['h'] for g in G))), 'h_max': str(int(-(-max(g['h'] for g in G) // 1))),
        'stand': de_date(d['stand']), 'test_datum': d['test']['datum'], 'test_n': str(d['test']['anzahl']), 'test_url': d['test']['url'],
        'wahl_satz': ', '.join('%s die %s' % (kf_klar(d['klassen'][g['kl'] - 1]['name']).replace('€', 'Euro'), kf_klar(g['name'])) for g in W),
        'test_namen': ', '.join(kf_klar(g['name']) for g in sorted(T, key=lambda g: g['rang'])),
    }
    return Z[key]


# JETZT DRAN (seit 21.11.2026): Saison-Ratgeber rücken kurz vor ihrem Termin in „Alle Ratgeber“ nach vorn und tragen eine kleine Marke.
# Je Seite: (ab, [(Termin, Text), …]). Sichtbar von „ab“ bis zum letzten Termin, die Marke nennt den nächsten Termin; danach verschwindet sie von selbst
# (die Seite wird täglich neu gebaut). Höchstens 4 Seiten gleichzeitig. Jedes Jahr die Termine für das neue Jahr eintragen (erbbuch/events.json).
JETZT = {'black-friday': ('2026-11-01', [('2026-11-30', 'Angebote bis 30.11.')]),
         'adventskranz': ('2026-11-08', [('2026-11-29', '1. Advent am 29.11.'), ('2026-12-06', '2. Advent am 6.12.')]),
         'geschenke': ('2026-11-22', [('2026-12-06', 'Nikolaus am 6.12.'), ('2026-12-24', 'Weihnachten am 24.12.')]),
         'weihnachten': ('2026-11-22', [('2026-12-24', 'Weihnachten am 24.12.')]),
         'tischdeko': ('2026-12-01', [('2026-12-24', 'Heiligabend am 24.12.')]),
         'gaestezimmer': ('2026-12-07', [('2026-12-24', 'Besuch zu Weihnachten')]),
         'silvester': ('2026-12-10', [('2026-12-31', 'Silvester am 31.12.')]),
         'ausmisten': ('2026-12-27', [('2027-01-31', 'Neues Jahr, neue Ordnung')])}


def jetzt(heute=None):
    """Liefert {Schlüssel: (nächster Termin, Text)} für die Saison-Seiten, die heute dran sind (höchstens 4, nächster Termin zuerst)."""
    import datetime
    if heute is None:
        try:
            from zoneinfo import ZoneInfo
            heute = datetime.datetime.now(ZoneInfo('Europe/Berlin')).date().isoformat()
        except Exception:
            heute = datetime.date.today().isoformat()
    an = {}
    for k, (ab, termine) in JETZT.items():
        nxt = [t for t in termine if t[0] >= heute]
        if ab <= heute and nxt:
            an[k] = nxt[0]
    return dict(sorted(an.items(), key=lambda x: x[1][0])[:4])


def alle():
    """Startseite (seit 16.11.2026): oben die Planer als Karten, darunter die Ratgeber als Fotokarten mit Suchfeld und Themen-Filter (Skript in site.js).
    Die Ratgeber stehen nach Erscheinungstag (neueste zuerst) und zeigen zuerst nur 8 Kacheln; der Knopf darunter öffnet alle.
    Sammelseiten mit vielen erzeugten Unterseiten bekommen EINE Kachel, die Unterseiten keine."""
    btn = ''.join('<button type="button" aria-pressed="%s" data-f="%s">%s</button>' % ('true' if not k else 'false', k, t) for k, t in FILTER if k != 'werkzeug')
    tools, out = [], []
    jd = jetzt()
    reihe = sorted(GRID, key=lambda g: ERST.get(g[3], '2026-01-01'), reverse=True)
    reihe = sorted([g for g in reihe if g[3] in jd], key=lambda g: jd[g[3]][0]) + [g for g in reihe if g[3] not in jd]
    for href, title, desc, key, img in reihe:
        if key in ('finder', 'lexikon', 'wohnideen'):
            continue
        t = thumb(img) if img else ''
        if 'werkzeug' in KAT.get(key, '').split():
            continue
        ph = ('<span class="rimg"><img src="%s" alt="" width="560" height="315" loading="lazy" decoding="async"></span>' % t) if t else ''
        mk = ('<small class="jd">%s </small>' % jd[key][1]) if key in jd else ''
        out.append('<a href="%s" data-k="%s">%s<b>%s%s</b><span>%s</span></a>' % (href, KAT.get(key, ''), ph, mk, title, desc))
    for href, title, desc, key, img in GRID:
        if 'werkzeug' in KAT.get(key, '').split():
            tools.append('<a href="%s"><span class="tl-i"><img src="%s" alt="" width="560" height="315" loading="lazy" decoding="async"></span><b>%s</b><span>%s</span></a>' % (href, thumb(img), title, desc))
    return ('<h3 class="hh">Planer</h3><div class="tools">%s</div><h3 class="hh" id="ratgeber-liste">Ratgeber</h3>'
            '<div class="hubf" id="hubf"><input type="search" id="hubq" placeholder="Ratgeber suchen, zum Beispiel Teppich" aria-label="Ratgeber durchsuchen" autocomplete="off" enterkeyhint="search">'
            '<div class="hubc" role="group" aria-label="Nach Thema filtern">%s</div></div>'
            '<div class="hub rel all cl" id="huball">%s<p class="hubn" id="hubn" hidden>Dazu haben wir noch nichts. Probier ein anderes Wort oder wähle „Alle“.</p></div>'
            '<p class="hubm"><button type="button" id="hubm" aria-controls="huball" aria-expanded="false">Alle Ratgeber zeigen</button></p>'
            '<p class="hubl">Zum Nachschlagen: <a href="lexikon.html">Lexikon</a><a href="stile.html">Wohnstile im Überblick</a><a href="einbetten.html">Planer einbetten</a></p>'
            % (''.join(tools), btn, ''.join(out)))


def palette(key, cls='palette'):
    s = STYLE[key]
    # Seit 11.11.2026: jede Farbe ist ein Knopf, Antippen kopiert den Farbwert (Skript in site.js, data-hex)
    return ('<div class="%s" role="list" aria-label="Farbkarte %s">%s</div><p class="pal-h">Tipp auf eine Farbe, dann ist ihr Farbwert kopiert.</p>' % (cls, s['name'], ''.join(
        '<span class="chip" role="listitem"><button type="button" data-hex="%s" aria-label="%s, Farbwert %s kopieren"><i style="background:%s"></i><span><b>%s</b><em>%s</em></span></button></span>'
        % (h.upper(), n, h.upper(), h, n, h.upper()) for n, h, t in s['pal'])))


def starts(key):
    s = STYLE[key]
    items = ''.join('<li><a href="%s" rel="sponsored nofollow noopener" target="_blank"><span>%s</span><em>Bei %s%s</em></a></li>' % (kauf(q)[0], t, kauf(q)[1], EXT)
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


LEX = sorted(json.loads((HERE / 'lexikon.json').read_text(encoding='utf-8'))['begriffe'],
             key=lambda b: b['name'].lower().replace('ä', 'a').replace('ö', 'o').replace('ü', 'u'))   # Lexikon: Liste auf lexikon.html und Erklärungen im Text


def lexikon_liste():
    return ''.join('<article class="lx-item" id="%s"><h2>%s</h2><p class="lx-k">%s</p><p>%s</p><p class="lx-l">%s</p></article>'
                   % (b['slug'], b['name'], b['kurz'], b['text'], ''.join('<a href="%s">%s</a>' % (h, t) for h, t in b['links'])) for b in LEX)


def lexikon_json():
    return json.dumps([{'n': b['name'], 'k': b['kurz'], 'u': 'lexikon.html#' + b['slug'], 'w': b['w'], 'l': ['/' + h for h, t in b['links']]} for b in LEX if b['w']],
                      ensure_ascii=False, separators=(',', ':'))


def styles_json():
    d = {}
    for s in STYLES:
        has = bool(s.get('img')) and (OUT / 'assets' / (s['img'] + '.jpg')).exists()
        d[s['key']] = {'name': s['name'], 'desc': s['desc'], 'pal': [[a, b] for a, b, c in s['pal']],
                       'start': [[t, amz_url(q).replace('&amp;', '&')] for t, q in s['start']], 'href': s['href'],
                       'img': s['img'] if has else None, 'alt': s.get('alt', ''),
                       'img2': s.get('img2') if s.get('img2') and (OUT / 'assets' / (s['img2'] + '.jpg')).exists() else None, 'alt2': s.get('alt2', '')}
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


def related(spec, plain=False, key=''):
    """Abschnitt „Passt dazu“. Darunter eine Zeile in den Feed „Wohnideen“ (seit 21.11.2026): Sie öffnet ihn beim Foto dieser Seite,
    das Titelbild wächst dabei zum ganzen Bildschirm (Seitenübergang in site.css)."""
    l = next((x for x in looks() if x['key'] == key and not x['n'].endswith('-2')), None) or next((x for x in looks() if x['key'] == key), None)
    mehr = '' if key == 'wohnideen' else '<p class="rel-st">Lieber erst mal schauen? <a href="wohnideen.html%s">Wohnideen zum Stöbern</a></p>' % ('#raum-' + l['n'] if l else '')
    return ('<section%s id="weiter"><div class="wrap"><div class="sec-h"><h2>Passt dazu.</h2></div>%s%s</div></section>'
            % ('' if plain else ' class="band"', tiles(spec), mehr))


def sources(m):
    """Quellenliste als aufklappbarer Block, Prüfdatum bleibt sichtbar.
    Design-Agent 18.11.2026: jede Quelle als Etikett (Name vor dem Doppelpunkt), Titel und Link; die Namen stehen schon im zugeklappten Knopf."""
    inner = m.group(1)
    checked = re.search(r'<p[^>]*>(Geprüft am.*?)</p>', inner, re.S)
    inner = re.sub(r'<p[^>]*>Geprüft am.*?</p>', '', inner, flags=re.S).strip()
    n = inner.count('<li')
    names = []

    def item(mi):
        li = mi.group(1).strip()
        link = ''
        ml = re.search(r'(<a [^>]*>.*?</a>)\s*$', li, re.S)
        if ml and li.count('<a ') == 1:
            link = ml.group(1).replace('<a ', '<a class="sq-a" ', 1)
            li = li[:ml.start()].strip()
        mn = re.match(r'([^:<]{2,45}):\s+', li)
        if mn:
            name, li = mn.group(1), li[mn.end():]
        elif link:
            name = re.sub(r'<.*?>', '', link)
        else:
            name = ''
        if name and name not in names:
            names.append(name)
        return '<li>%s%s<span class="sq-t">%s</span></li>' % (
            '<span class="sq-n">%s</span>' % name if name else '', link, li)

    inner = re.sub(r'<li>(.*?)</li>', item, inner, flags=re.S)
    pre = ' · '.join(names[:4]) + (' und %d weitere' % (len(names) - 4) if len(names) > 4 else '')
    chk = ''
    if checked:
        chk = re.sub(r'(Geprüft am\s\d{1,2}\.\d{1,2}\.\d{4})', r'<span class="sq-chk">\1</span>', checked.group(1), count=1)
        chk = re.sub(r'</span>\.\s*$', '</span>', chk)
    return ('<details class="src srcx"><summary><span class="sq-s">%s</span>%s</summary>%s</details>%s' % (
        'Alle %d Quellen anzeigen' % n if n > 1 else 'Quelle anzeigen',
        '<span class="sq-pre">%s</span>' % pre if pre else '', inner,
        '<p class="src checked">%s</p>' % chk if chk else ''))


def mini(js):
    """Skript für die Auslieferung schlanker machen: Blockkommentare, Einrückung und Leerzeilen entfernen.
    Der lesbare Quelltext bleibt im Branch quellen. Voraussetzung: keine Zeilenkommentare und keine mehrzeiligen Zeichenketten im Skript."""
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
    return '\n'.join(l.strip() for l in js.split('\n') if l.strip()) + '\n'


def kurz_desc(d, mx=160, mn=90):
    """Beschreibung fürs Suchergebnis: höchstens mx Zeichen, an einer Satzgrenze gekürzt. Geht das nicht, bleibt sie, wie sie ist."""
    if len(d) <= mx:
        return d
    out = ''
    for part in re.split(r'(?<=[.!?])\s+', d):
        if len(out) + len(part) + (1 if out else 0) > mx:
            break
        out = (out + ' ' + part).strip()
    return out if len(out) >= mn else d


def de_date(iso):
    y, m, d = iso.split('-')
    return '%s.%s.%s' % (d, m, y)


def read_page(src):
    t = src.read_text()
    meta = json.loads(re.search(r'<!--meta(.*?)-->', t, re.S).group(1))
    head = t.split('<!--HEAD-->')[1].split('<!--MAIN-->')[0].strip() if '<!--HEAD-->' in t else ''
    main = t.split('<!--MAIN-->')[1].split('<!--END-->')[0].strip()
    end = t.split('<!--END-->')[1].strip() if '<!--END-->' in t else ''
    meta['_datiert'] = 'updated' in meta
    meta.setdefault('updated', DEFAULT_UPDATED)
    meta['noindex'] = 'noindex' in head
    return meta, head, main, end


def page(src):
    meta, head, main, end = read_page(src)
    key = meta['key']
    path = '' if key == 'index' else src.name
    navkey = 'stile' if key in STYLE else key   # Stil-Ratgeber gehören zu „Stile“
    links = ''.join('<a href="%s"%s>%s</a>' % (h, CUR if k == navkey else '', n) for h, n, k in NAV)
    # Menü (seit 16.11.2026): Stil-Finder, Planer als Karten, Ratgeber nach Thema als kurze Listen (auf dem Handy aufklappbar)
    istool = lambda k: 'werkzeug' in KAT.get(k, '').split()
    grid = '<a class="m-go" href="wohnideen.html"%s><span><b>Wohnideen zum Stöbern</b><small>Ein Raum pro Bildschirm, jeder mit Tipp und Farben</small></span><i aria-hidden="true">→</i></a>' % (CUR if key == 'wohnideen' else '')
    grid += '<a class="m-go" href="./#stil-finder"><span><b>Welcher Stil passt zu dir?</b><small>Sechs Bildpaare, dann dein Stil mit Farben</small></span><i aria-hidden="true">→</i></a>'
    grid += '<p class="m-h">Planer</p><nav class="m-grid" aria-label="Planer">%s</nav>' % ''.join(
        '<a href="%s"%s><b>%s</b><small>%s</small></a>' % (h, CUR if k == key else '', n, s_) for h, n, s_, k, p in GRID if istool(k))
    cols = ''
    for fk, lab in FILTER:
        if fk in ('', 'werkzeug'):
            continue
        hs = [(h, n, k) for h, n, s_, k, p in GRID if not istool(k) and k not in ('finder', 'lexikon', 'wohnideen') and KAT.get(k, '').split()[:1] == [fk]]
        if hs:
            cols += '<details class="m-d"%s><summary>%s</summary><div>%s</div></details>' % (' open' if any(k == key for h, n, k in hs) else '', lab, ''.join('<a href="%s"%s>%s</a>' % (h, CUR if k == key else '', n) for h, n, k in hs))
    grid += '<p class="m-h">Ratgeber</p><nav class="m-cols" aria-label="Ratgeber nach Thema">%s</nav>' % cols
    grid += '<p class="m-h">Nachschlagen</p><nav class="m-more" aria-label="Nachschlagen"><a href="lexikon.html"%s>Lexikon</a><a href="einbetten.html">Planer einbetten</a></nav>' % (CUR if key == 'lexikon' else '')
    flinks = fcols(key)
    stand = '' if key == '404' else '<p class="stand">Stand: %s</p>' % de_date(meta['updated'])
    # Suchergebnis: Titel ohne Marke höchstens 60 Zeichen, Beschreibung höchstens 160 (og:description behält den vollen Text)
    sdesc = kurz_desc(meta['desc'])
    suchbar = not meta['noindex'] and key not in ('impressum', 'datenschutz', '404')
    core = meta['title'].replace(' – Stil-Daheim', '')
    if suchbar and len(core) > 60:
        print('HINWEIS %s: Titel ohne Marke %d Zeichen (höchstens 60), bitte kürzen: %s' % (src.name, len(core), core))
    if suchbar and len(sdesc) > 160:
        print('HINWEIS %s: Beschreibung %d Zeichen (höchstens 160) und der erste Satz ist zu lang zum Kürzen, bitte desc kürzen' % (src.name, len(sdesc)))
    robots = '<meta name="robots" content="max-image-preview:large">' if suchbar else ''   # große Bildvorschau bei Google erlauben
    html = ('<!doctype html><html lang="de"><head><meta charset="utf-8">'
            '<script>try{var t=localStorage.getItem("sdth");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="p:domain_verify" content="ad440d6123f283fdf603af68f7587653"/>\n'
            '<title>%(stitle)s</title><meta name="description" content="%(sdesc)s">\n'
            '<meta property="og:title" content="%(title)s"><meta property="og:description" content="%(desc)s"><meta property="og:type" content="website">'
            '<meta property="og:image" content="%(dom)s%(og)s"><meta property="og:url" content="%(dom)s%(path)s"><meta property="og:locale" content="de_DE"><meta name="twitter:card" content="summary_large_image">\n'
            '<link rel="canonical" href="%(dom)s%(path)s">%(robots)s<meta name="theme-color" content="#f6f6f3" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#121614" media="(prefers-color-scheme: dark)">\n'
            '<link rel="preload" href="assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>'
            '<link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="manifest" href="manifest.webmanifest"><link rel="alternate" type="application/rss+xml" title="Stil-Daheim: neue Ratgeber" href="feed.xml">'
            '<link rel="stylesheet" href="site.css">\n%(head)s\n<script src="site.js" defer></script></head><body>\n'
            '<a class="skip" href="#main">Zum Inhalt springen</a>\n'
            '<header class="hd" id="hd"><div class="hd-in"><a class="logo" href="index.html">%(lamp)s<span>Stil-Daheim</span></a>'
            '<nav class="nav" aria-label="Hauptmenü">%(links)s</nav>'
            '<button class="ic" id="th" type="button" aria-label="Hell oder dunkel umschalten">%(sun)s%(moon)s</button>'
            '<button class="ic mb" id="mb" type="button" aria-expanded="false" aria-controls="msheet">%(burger)s<span>Menü</span></button></div></header>\n'
            '<div class="sheet-m" id="msheet" hidden role="dialog" aria-modal="true" aria-label="Menü"><div class="sheet-in">'
            '<div class="sheet-top"><b>Stil-Daheim</b><button class="ic" id="mclose" type="button" aria-label="Menü schließen">%(close)s</button></div>'
            '<div id="mtoc-wrap" hidden><p class="m-h">Auf dieser Seite</p><nav class="m-toc" id="mtoc" aria-label="Auf dieser Seite"></nav></div>'
            '%(grid)s'
            '<p class="m-foot"><a href="so-arbeiten-wir.html">So arbeiten wir</a> · <a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a> · Schwesterseite: <a href="https://strom-daheim.de/">Strom-Daheim</a></p></div></div>\n'
            '<main id="main">\n%(main)s\n</main>\n'
            '<footer class="ft"><div class="wrap"><p>Alle Angaben sind Richtwerte nach den genannten Quellen, ohne Gewähr. Die Raumfotos sind Beispielbilder. '
            'Mit „Anzeige“ markierte Links sind Partnerlinks zu Amazon oder, über das Netzwerk Awin, zu Fachhändlern wie OTTO, Lampenwelt und teppich.de: Kaufst du darüber, erhalten wir eine Provision. Für dich ändert sich der Preis nicht. '
            'Als Amazon-Partner verdienen wir an qualifizierten Verkäufen.</p>%(stand)s'
            '<nav class="ft-links fc" aria-label="Alle Seiten">%(flinks)s<div><p class="fc-h">Stil-Daheim</p><a href="so-arbeiten-wir.html">So arbeiten wir</a><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="https://strom-daheim.de/">Schwesterseite Strom-Daheim</a></div></nav><p class="fc-c">© 2026 Stil-Daheim</p>%(badge)s</div></footer>\n'
            '%(end)s\n%(gc)s\n</body></html>\n') % dict(badge='<span class="preview">Vorschau, noch nicht veröffentlicht</span>' if PREVIEW else '', gc=GOAT,
                                                  title=meta['title'], stitle=(meta['title'][:-len(' – Stil-Daheim')] if len(meta['title']) > 62 and meta['title'].endswith(' – Stil-Daheim') else meta['title']), desc=meta['desc'], sdesc=sdesc, robots=robots, dom=DOMAIN, og=ogimg(meta), stand=stand,
                                                  path=path, head=head, lamp=LAMP, links=links, sun=SUN, moon=MOON, burger=BURGER,
                                                  close=CLOSE, grid=grid, main=main, flinks=flinks, end=end)
    html = html.replace('{{amzdeals}}', 'https://www.amazon.de/deals?tag=%s' % TAG)
    html = html.replace('{{PRINT}}', PRINT).replace('{{SHARE}}', SHARE).replace('{{ARROW}}', ARROW).replace('{{EXT}}', EXT)
    html = html.replace('{{STRIPS}}', strips()).replace('{{STYLES_JSON}}', styles_json())
    if '{{LEXIKON}}' in html:
        html = html.replace('{{LEXIKON}}', lexikon_liste())
    html = re.sub(r'\{\{PALETTE:(\w+)\}\}', lambda m: palette(m.group(1)), html)
    html = re.sub(r'\{\{STARTS:(\w+)\}\}', lambda m: starts(m.group(1)), html)
    html = re.sub(r'\{\{PIC:([^|}]+)\|([^|}]*)\|([^}]*)\}\}', lambda m: pic(m.group(1), m.group(2), m.group(3)), html)
    html = re.sub(r'\{\{HERO:([^|}]+)\|([^}]*)\}\}', lambda m: pic(m.group(1), m.group(2), '100vw', lazy=False), html)
    html = re.sub(r'\{\{FIG:([^|}]+)\|([^|}]*)\|([^}]*)\}\}', lambda m: fig(m.group(1), m.group(2), m.group(3)), html)
    html = html.replace('{{ALLE}}', alle()) if '{{ALLE}}' in html else html
    if '{{WOHNIDEEN' in html:
        html = html.replace('{{WOHNIDEEN_GRID}}', wohnideen_grid()).replace('{{WOHNIDEEN_N}}', str(len(looks()))).replace('{{WOHNIDEEN}}', wohnideen_feed())
    if '{{SCHAUFENSTER' in html:
        html = html.replace('{{SCHAUFENSTER_N}}', str((len(looks_heute()[1]) - 1) // 10 * 10)).replace('{{SCHAUFENSTER}}', schaufenster())
    html = re.sub(r'\{\{RELATED:([\w,=-]+)(\|plain)?\}\}', lambda m: related(m.group(1), bool(m.group(2)), key), html)
    html = re.sub(r'\{\{TILES:([\w,=-]+)\}\}', lambda m: tiles(m.group(1)), html)
    if '{{KF' in html:   # Kaffee-Ratgeber aus kaffee.json
        html = html.replace('{{KF_VERGLEICH}}', kf_vergleich()).replace('{{KF_LEISTE}}', kf_leiste()).replace('{{KF_LEITER}}', kf_leiter()).replace('{{KF_QUELLEN}}', kf_quellen())
        html = re.sub(r'\{\{KF_KARTEN:(\w+)\}\}', lambda m: kf_karten(m.group(1)), html)
        html = re.sub(r'\{\{KF:(\w+)\}\}', lambda m: kf_zahl(m.group(1)), html)
    html = re.sub(r'\{\{otto:(.*?)\}\}', lambda m: otto_url(m.group(1)), html)
    html = re.sub(r'\{\{awin:(\d+)\|([^}]*)\}\}', lambda m: awin_url(m.group(1), m.group(2).strip()), html)
    html, _get = awin_haupt(html)
    html = re.sub(r'\{\{amz:(.*?)\}\}', amz, html)
    html = awin_zeile(html, pathlib.Path(str(src)).stem, _get)
    html = re.sub(r'<div class="src">(.*?)</div>', sources, html, flags=re.S)
    html = html.replace('href="index.html#', 'href="./#').replace('href="index.html"', 'href="./"')
    html = html.replace('Stil-Daheim', BRAND)
    html = seo(html, meta, path)
    assert '{{' not in html, (src.name, html[html.find('{{'):html.find('{{') + 60])
    if src.name == '404.html':
        html = re.sub(r'(href|src|srcset)="(?!https?:|#|/|mailto:)([^"]+)"', lambda m: '%s="/%s"' % (m.group(1), m.group(2).lstrip('./') if m.group(2) not in ('./',) else ''), html)
        html = re.sub(r'(srcset="[^"]*")', lambda m: re.sub(r'(?<=[ "])assets/', '/assets/', m.group(1)), html)
        html = html.replace('url(assets/fonts/', 'url(/assets/fonts/')
    (OUT / src.name).write_text(html)
    return meta


def _txt(s):
    import html as H
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def ogimg(meta):
    """Teilen-Bild: assets/og/<key>.jpg (1200x630, mit Titel), sonst das Foto aus meta og."""
    if (OUT / 'assets' / 'og' / (meta['key'] + '.jpg')).exists():
        return 'assets/og/%s.jpg' % meta['key']
    return meta.get('og', 'assets/start.jpg')


def toc(main):
    """Inhaltsverzeichnis mit Lesezeit unter „Kurz gesagt“."""
    items = []
    for sid, body in re.findall(r'<section[^>]*\bid="([^"]+)"[^>]*>(.*?)</section>', main, re.S):
        if sid in ('quellen', 'kurz-gesagt'):
            continue
        m = re.search(r'<h2[^>]*>(.*?)</h2>', body, re.S)
        if m:
            items.append((sid, re.sub(r'<[^>]+>', '', m.group(1)).strip().rstrip('.')))
    if len(items) < 3:
        return ''
    words = len(re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>|<[^>]+>', ' ', main, flags=re.S).split())
    lis = ''.join('<li><a href="#%s">%s</a></li>' % (i, t) for i, t in items)
    return '<details class="toc"><summary><span>Inhalt</span><span class="toc-t">%d Min. Lesezeit</span></summary><ol>%s</ol></details>' % (max(1, round(words / 200)), lis)


def suche(metas):
    """Suchindex suche.json für die Suche im Menü."""
    idx = []
    for m in metas:
        if m['noindex'] or m['key'] in ('impressum', 'datenschutz', '404'):
            continue
        h = (OUT / m['file']).read_text()
        hs = ' '.join(re.sub(r'<[^>]+>', '', x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', h, re.S))
        idx.append({'u': 'index.html' if m['key'] == 'index' else m['file'], 't': m['title'].split(' – ')[0], 'd': m['desc'], 'k': hs[:400]})
    (OUT / 'suche.json').write_text(json.dumps(idx, ensure_ascii=False, separators=(',', ':')))


def seo(html, meta, path):
    """Kasten „Kurz gesagt“ (meta kurz) und strukturierte Daten (Article, FAQPage, BreadcrumbList) für Suchmaschinen und KI-Assistenten."""
    if meta['noindex'] or meta['key'] in ('impressum', 'datenschutz', '404'):
        return html
    i0 = html.index('<main')
    if meta.get('kurz'):
        box = '<section class="kurz-s"><div class="wrap narrow"><div class="kurz" id="kurz-gesagt"><b>Kurz gesagt</b><p>%s</p></div>%s</div></section>\n' % (meta['kurz'], toc(html[i0:html.index('</main>')]))
        after = meta.get('kurz_nach')   # Werkzeug-Seiten: Kasten erst nach dem genannten Abschnitt, damit das Werkzeug oben steht
        i = html.index('</section>', html.index('<section id="%s"' % after, i0)) + len('</section>') if after else html.index('<section', i0)
        html = html[:i] + ('\n' if after else '') + box + html[i:]
    main = html[i0:html.index('</main>')]
    url = DOMAIN + path
    org = {'@type': 'Organization', 'name': 'Stil-Daheim', 'url': DOMAIN}
    erst = ERST.setdefault(meta['key'], meta['updated'] if meta['_datiert'] else datetime.date.today().isoformat())
    if meta['key'] == 'index':
        graph = [{'@type': 'WebSite', 'name': 'Stil-Daheim', 'url': DOMAIN, 'inLanguage': 'de-DE', 'description': meta['desc'],
                  'publisher': dict(org, logo=DOMAIN + 'apple-touch-icon.png')}]
    else:
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', main, re.S)
        art = {'@type': 'Article', 'headline': _txt(h1.group(1))[:110] if h1 else meta['title'], 'name': meta['title'], 'description': meta['desc'],
               'inLanguage': 'de-DE', 'url': url, 'mainEntityOfPage': url, 'datePublished': erst, 'dateModified': max(meta['updated'], erst), 'author': org, 'publisher': org,
               'image': DOMAIN + ogimg(meta)}
        if meta.get('kurz'):
            art['abstract'] = _txt(meta['kurz'])
        graph = [art]
        q = []
        for sec in re.findall(r'<section[^>]*id="fragen"[^>]*>.*?</section>', main, re.S):
            for a, b in re.findall(r'<details[^>]*>\s*<summary>(.*?)</summary>\s*<div>(.*?)</div>\s*</details>', sec, re.S):
                if _txt(a) and _txt(b):
                    q.append({'@type': 'Question', 'name': _txt(a), 'acceptedAnswer': {'@type': 'Answer', 'text': _txt(b)}})
        if q:
            graph.append({'@type': 'FAQPage', 'mainEntity': q})
        graph.append({'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Stil-Daheim', 'item': DOMAIN},
            {'@type': 'ListItem', 'position': 2, 'name': art['headline'][:80], 'item': url}]})
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('</', '<\\/')
    return html.replace('</head>', '<script type="application/ld+json">%s</script>\n</head>' % ld, 1)


def llms(metas):
    """Übersicht für KI-Assistenten (llms.txt)."""
    order = ['index'] + [g[3] for g in GRID]
    ms = sorted([m for m in metas if not m['noindex'] and m['key'] not in ('impressum', 'datenschutz', '404')],
                key=lambda m: (order.index(m['key']) if m['key'] in order else 99, m['file']))
    lines = ['# Stil-Daheim', '', '> Ratgeber-Website zum Einrichten in Deutschland: Wohnstile mit Farbkarten, Stil-Finder, Raum-Rechner (Teppich, Vorhang, Bilder, Lampe, Wandfarbe, Tapete, Couchtisch, Fernseher-Abstand, Bett, Flurläufer) und schöner wohnen zur Miete. Mit Quellen und Prüfdatum. Finanziert über gekennzeichnete Amazon-Partnerlinks.', '', '## Ratgeber und Rechner', '']
    for m in ms:
        lines.append('- [%s](%s%s): %s' % (m['title'].replace(' – Stil-Daheim', ''), DOMAIN, '' if m['key'] == 'index' else m['file'], m['desc']))
    (OUT / 'llms.txt').write_text('\n'.join(lines) + '\n')


def feed(metas):
    """feed.xml: die 30 neuesten Seiten als RSS (Tag der ersten Veröffentlichung aus erstdatum.json)."""
    import email.utils, html as H
    ms = [m for m in metas if not m['noindex'] and m['key'] not in ('index', 'impressum', 'datenschutz', '404', 'einbetten') and ERST.get(m['key'])]
    ms.sort(key=lambda m: (ERST[m['key']], m['file']), reverse=True); x = lambda v: H.escape(H.unescape(v), quote=False)
    body = ''.join('<item><title>%s</title><link>%s%s</link><guid isPermaLink="true">%s%s</guid><pubDate>%s</pubDate><description>%s</description></item>'
                   % (x(m['title'].replace(' – ' + BRAND, '')), DOMAIN, m['file'], DOMAIN, m['file'], email.utils.format_datetime(datetime.datetime.fromisoformat(ERST[m['key']] + 'T08:00:00+01:00')), x(m['desc'])) for m in ms[:30])
    (OUT / 'feed.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>%s: neue Ratgeber und Planer</title><link>%s</link>'
                                  '<description>Neue Ratgeber und Werkzeuge rund ums Einrichten.</description><language>de-DE</language><atom:link href="%sfeed.xml" rel="self" type="application/rss+xml"/>%s</channel></rss>\n' % (BRAND, DOMAIN, DOMAIN, body), encoding='utf-8')


def sitemap(metas):
    order = ['index'] + [g[3] for g in GRID]
    ms = sorted([m for m in metas if not m['noindex']], key=lambda m: (order.index(m['key']) if m['key'] in order else 99, m['file']))
    urls = ''.join('<url><loc>%s%s</loc><lastmod>%s</lastmod></url>' % (DOMAIN, '' if m['key'] == 'index' else m['file'], m['updated']) for m in ms)
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s</urlset>\n' % urls)


if __name__ == '__main__':
    import wandfarben; wandfarben.main()   # erzeugt pages/wandfarben.html und pages/wandfarbe-*.html aus wandfarben.json
    names = sys.argv[1:] or [p.name for p in sorted(SRC.glob('*.html'))]
    sj = (HERE / 'site.js').read_text(encoding='utf-8')
    for name, wert in (('__AUS__', K_AUS), ('__TEP__', K_TEP), ('__LAM__', K_LAM), ('__MOE__', K_MOE)):
        assert name in sj, name
        sj = sj.replace(name, wert)
    assert '__LWW__' in sj and '__TEPZ__' in sj
    (OUT / 'site.js').write_text(sj.replace('__LWW__', json.dumps(LW_WORT, ensure_ascii=False)).replace('__TEPZ__', json.dumps(TEP_ZIEL, ensure_ascii=False)), encoding='utf-8')   # Kauf-Regel aus build.py einsetzen
    (OUT / 'draw.js').write_text((HERE / 'draw.js').read_text().replace('{{TAG}}', TAG))
    (OUT / 'raumplaner.js').write_text('/* Stil-Daheim Raumplaner. Lesbarer Quelltext mit Kommentaren: Branch quellen, raumplaner.js */\n' + mini((HERE / 'raumplaner.js').read_text().replace('{{TAG}}', TAG)))
    (OUT / 'studio.js').write_text((HERE / 'studio.js').read_text(encoding='utf-8').replace('{{TAG}}', TAG), encoding='utf-8')   # Wandfarben-Studio, Partner-Tag für die Einkaufsliste
    (OUT / 'wohnideen.js').write_text('/* Stil-Daheim Wohnideen. Lesbarer Quelltext mit Kommentaren: Branch quellen, wohnideen.js */\n' + mini((HERE / 'wohnideen.js').read_text(encoding='utf-8')), encoding='utf-8')
    for f in ('site.css', 'frag.js', 'studio.css', 'kaffee-film.js', 'sw.js', 'manifest.webmanifest'):   # sw.js und Manifest: als App installierbar, siehe site.js; kaffee-film.js: Kaffee-Filme (kaffee.html, Startseite)
        shutil.copyfile(HERE / f, OUT / f)
    (OUT / 'lexikon.json').write_text(lexikon_json() + '\n', encoding='utf-8')
    for f in (HERE / 'app').glob('*.png'):                    # App-Symbole fürs Manifest
        shutil.copyfile(f, OUT / 'assets' / f.name)
    (OUT / '.well-known').mkdir(exist_ok=True)                # Android-App (Ordner android/): Nachweis, dass App und Website zusammengehören
    shutil.copyfile(HERE / 'app' / 'assetlinks.json', OUT / '.well-known' / 'assetlinks.json')
    (OUT / 'CNAME').write_text(DOMAIN.split('/')[2] + '\n')
    (OUT / '.nojekyll').write_text('')
    (OUT / 'bc5564f7c1405d082c6e3b0873cb208a.txt').write_text('bc5564f7c1405d082c6e3b0873cb208a')  # IndexNow-Schlüssel (Bing), nicht entfernen
    (OUT / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % DOMAIN)
    metas = []
    for n in names:
        m = page(SRC / n)
        m['file'] = n
        metas.append(m)
        print('gebaut:', n)
    ERST_DATEI.write_text(json.dumps(ERST, ensure_ascii=False, indent=1, sort_keys=True) + '\n')
    if not sys.argv[1:]:
        sitemap(metas)
        feed(metas)
        llms(metas)
        suche(metas)
        import frag_index; frag_index.main(str(OUT))   # frag.json: geprüfte Fragen und Antworten aller Seiten für frag.js (Suche, „Noch eine Frage?“)
        print('sitemap.xml:', sum(1 for m in metas if not m['noindex']), 'Seiten')
