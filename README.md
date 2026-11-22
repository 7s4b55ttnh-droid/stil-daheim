# Stil-Daheim – Quellen

Dieser Branch (`quellen`) enthält die Quellen der Website https://stil-daheim.de.
Die fertige Website liegt im Branch `main` desselben Repositorys und wird von GitHub Pages ausgeliefert.

## Ordner

| Pfad | Inhalt |
|---|---|
| `build.py` | Baut alle Seiten: Kopf, Menü, Fußzeile, Besucherzähler, Amazon-Links, Sitemap |
| `pages/*.html` | Seitenbausteine (meta-Kommentar, `<!--HEAD-->`, `<!--MAIN-->`, `<!--END-->`) |
| `entwuerfe/` | Seiten in Arbeit, werden nicht gebaut |
| `draw.js` | Rechner und Maßzeichnungen (Teppich, Vorhang, Bilder, Lampe, Farbe, Tapete) |
| `raumplaner.js` | Raumplaner: Rechenkern `RP` (Geometrie, Vorschläge, Raum-Check, läuft auch in Node) und Oberfläche. `build.py` liefert ihn ohne Kommentare aus |
| `tests/` | `raumplaner-kern.js` (2.000 Zufallsräume, ohne Browser) und `raumplaner-test.js` (Bedientest mit Playwright) |
| `site.css`, `site.js` | Gemeinsames Design und Bedienung aller Seiten |
| `kaffee.json` | Alle Maschinen des Kaffee-Ratgebers (Daten, Preisklasse, Maßbild), siehe „Kaffee-Ratgeber“ |

Bilder liegen nur im Branch `main` unter `assets/` (je `name.jpg`, `name.webp` mit 1672 px Breite und `name-m.jpg`, `name-m.webp` mit 960 px).

## Bauen

```
git clone https://github.com/7s4b55ttnh-droid/stil-daheim stil-daheim
git clone -b quellen https://github.com/7s4b55ttnh-droid/stil-daheim stil-daheim-src
cd stil-daheim-src
python3 build.py          # schreibt nach ../stil-daheim
```

Danach beide Ordner committen und pushen: `stil-daheim-src` nach `quellen`, `stil-daheim` nach `main`.
Fertige HTML-Dateien in `main` nie direkt bearbeiten, sonst überschreibt sie der nächste Build.

## Neue Seite

1. `pages/name.html` mit meta-Kommentar anlegen (`key`, `title`, `desc`, `og`, `updated`).
2. In `build.py` in `GRID` eintragen (Menü, Fußzeile, Kacheln „Passt dazu“), wichtige Seiten auch in `NAV`.
3. Abschnitte als `<section id="…">` mit `<h2>`; Quellen mit Prüfdatum am Ende.
4. Amazon-Links nur über `{{amz:Suchbegriff}}` und mit „Anzeige“ kennzeichnen.
5. `python3 build.py`, auf dem Handy (390 px) und am Rechner testen, dann pushen.

Impressum und Datenschutz nennen bewusst keine Straße. Bitte so lassen.

## Raumplaner

`pages/raumplaner.html` zeigt den Plan, `raumplaner.js` rechnet. Alle Faustregeln stehen oben im Skript in `RULE` und auf der Seite im Abschnitt „Das prüft der Planer“ mit Quellen. Wer eine Regel ändert, ändert beides.

- Vorschläge (`preset`) probieren Varianten durch und nehmen die mit den wenigsten Mängeln im Raum-Check. Der Startplan für das Standardzimmer ist als `START` fest eingetragen, damit die Seite sofort steht.
- Nach jeder Änderung am Skript: `node tests/raumplaner-kern.js` (muss mit „harte Fehler 0 | Räume mit bad 0“ enden), dann bauen und `node tests/raumplaner-test.js` (muss „ALLE TESTS BESTANDEN“ melden).
- Der Plan liegt nur im Browser (`localStorage` „sdrp“) oder im geteilten Link (`?p=…`). Es gibt keinen Server und keine Übertragung, so steht es auch auf der Seite.
- Keine Zeilenkommentare (`//`) und keine mehrzeiligen Zeichenketten im Skript, sonst bricht die Verkleinerung in `build.py` (`mini`).

## Weitere Werkzeuge (seit 14.11.2026)

- `pages/bilderwand.html`: Bilderwand-Planer (Skript in der Seite, Kern `window.BW`). Test: `node tests/bilderwand-test.js [Basisadresse]`.
- `pages/farbpalette.html`: Farbpalette aus Foto (Skript in der Seite, Kern `window.FP`; das Foto bleibt im Browser). Test: `node tests/farbpalette-test.js [Basisadresse]`.
- 3D-Ansicht im Raumplaner (`raumplaner.js`, Abschnitt „3D-Ansicht“): nur zum Ansehen, Höhen in `HK` sind Richtwerte. Neue Möbelart im Katalog: prüfen, ob `parts3()` eine passende Form liefert. Test: `node tests/raumplaner-3d-test.js [Basisadresse]`.
- Einbett-Modus: `?einbetten=1` zeigt nur den Abschnitt mit `data-emb` (site.js, site.css). Anleitung für fremde Websites: `pages/einbetten.html`.

## Wohnideen zum Stöbern, Schaufenster, Bilder-Duell (seit 21.11.2026)

Wunsch des Inhabers: Die Seite soll zum Schauen einladen. Dafür gibt es drei Bausteine, alle aus den vorhandenen Raumfotos (keine neuen Bilder nötig):

- `pages/wohnideen.html` + `wohnideen.js`: ein Raum pro Bildschirm (der `<body>` rollt und rastet ein). Jeder Raum hat einen Tipp, fünf Farben aus dem Foto, Merken (nur im Browser, `localStorage` „sdmerk“), Teilen und den Link zum Ratgeber. „Alle Räume“ zeigt Übersicht, Filter, gemerkte Räume und daraus die „Farbwelt“ mit dem nächstgelegenen Stil.
- Die Räume entstehen in `build.py`, Abschnitt **WOHNIDEEN**: Jedes Foto, das eine Seite aus `GRID` als `{{HERO:…}}` oder `{{FIG:…}}` zeigt, wird automatisch ein Raum. Tipp = `LOOK_TIPP[foto]`, sonst die Bildunterschrift (FIG) oder der erste Satz von `kurz` (HERO). **Nur Fakten, die auf der Seite belegt sind.** Fotos ohne HERO/FIG: `LOOK_FEST`. Saison: `LOOK_ZEIT` (außerhalb blendet das Skript sie aus). Nicht im Feed: `LOOK_AUS`.
- Farben je Foto rechnet der Build einmal und legt sie in `looks.json` ab (mit einchecken). Namen kommen aus `FARBNAMEN` (nächster Ton), sie sind Beschreibungen, keine Farbtöne eines Herstellers.
- Der Build legt je Raum `assets/<foto>-t.webp` (Übersicht) und `assets/<foto>-h.webp` (Hochformat für Schaufenster und Duell, Bildmitte in `LOOK_FX`) an.
- Startseite: `{{SCHAUFENSTER}}` (16 Karten, Auswahl wechselt mit dem Build-Tag, Reihenfolge mischt das Skript täglich) und der Stil-Finder als Bilder-Duell (`D` im Skript der Startseite, zweites Foto je Stil: `img2`/`alt2` in `STYLES`). Die fünf Fragen bleiben als zweiter Weg.
- Bewegung: Kamerafahrt im Feed, Schaufenster und Bühne (site.css „Bühne in Bewegung“) sind bei „Bewegung reduzieren“ aus; im Feed hält der Knopf oben alles an.
- KI-Kennzeichnung läuft wie überall automatisch (site.js): Marke „KI“ in jedem Raumbild, eine Zeile über Übersicht und Schaufenster.
- Keine Zeilenkommentare (`//`) in `wohnideen.js` (wird mit `mini` verkleinert).
- Test: `node tests/wohnideen-test.js [Basisadresse]` (Feed, Übersicht, Farbwelt, Saison, Handy, ohne Skript, Schaufenster, Duell, Kopfzeile).

## Kaffee-Ratgeber (seit 22.11.2026 aus `kaffee.json`)

Wunsch des Inhabers: Die Auswahl soll Sinn ergeben (in jeder Preisklasse das beste Gerät) und gut aussehen, auch ohne Produktfotos.

- **Eine Datei für alle Maschinen:** `kaffee.json`. `build.py` (Abschnitt **KAFFEE-RATGEBER**) macht daraus die Karten (`{{KF_KARTEN:barista}}`, `{{KF_KARTEN:filter}}`), die Preisklassen-Leiter der Vollautomaten (`{{KF_LEITER}}`), die Leiste „Unsere Wahl je Preisklasse“ (`{{KF_LEISTE}}`), die Zeilen des Vergleichs (`{{KF_VERGLEICH}}`), die Quellen (`{{KF_QUELLEN}}`) und alle Zahlen im Text (`{{KF:n}}`, `{{KF:b_voll}}`, `{{KF:wahl_satz}}` …, siehe `kf_zahl`). In `pages/kaffee.html` stehen deshalb keine Gerätenamen, Maße oder Stückzahlen mehr von Hand, außer im Finder (siehe unten) und in zwei Antworten unter „Häufige Fragen“.
- **Neues Gerät oder Preis geändert:** nur `kaffee.json` anfassen. `preis` ist der bei OTTO gesehene Preis am Tag `stand` (wird nicht angezeigt). Daraus rechnet der Build die Preisklasse (unter 300, 300 bis 500, 500 bis 800, 800 bis 1.000, über 1.000 Euro) und die Reihenfolge. Nach einer Preisprüfung `stand` auf das Datum setzen. Ist `stand` älter als 45 Tage, meldet der Build einen HINWEIS.
- **Regeln, die der Build prüft:** jede `url` ist eine OTTO-Produktseite (`https://www.otto.de/p/…`, kein Suchlink), jedes Gerät hat Preis-Leistung (`pl` 1 = Sehr gut, 2 = Gut, 3 = Okay) mit Begründung, Dafür und Dagegen, Breite und Höhe. Bei den Vollautomaten hat **jede Preisklasse genau eine „Unsere Wahl“** (`wahl`).
- **Auswahl:** Preis-Leistung ist unsere Einschätzung, kein Test. Wo es ein aktuelles Urteil der Stiftung Warentest gibt, nehmen wir nur Geräte auf, die dort gut abgeschnitten haben, und kennzeichnen sie mit `"test": ""` (oder einem kurzen Zusatz wie „geprüft als …“). **Nur setzen, wenn das Urteil belegt ist** (Testsiegel auf der OTTO-Produktseite, Seite des Herstellers, test.de). **Keine Noten, kein „Testsieger“, kein Logo auf der Seite**: Für Werbung mit ihrem Logo verlangt die Stiftung einen Lizenzvertrag (test.de, „Werbung mit Tests“). Wir nennen deshalb nur, dass geprüft wurde, und verlinken test.de. Der Test der Seite prüft das. Erscheint ein neuer Test, `test` in `kaffee.json` (Datum, Anzahl, Adresse) und die Kennzeichen anpassen.
- **Maßbilder statt Fotos:** OTTO erlaubt nur eigenes Material aus dem Produktfeed (Partnerbedingungen § 4 und § 5), Bilder von otto.de dürfen wir nicht übernehmen. Der Build zeichnet deshalb je Gerät ein Maßbild von vorn (`kf_massbild`): Bauart aus `bild` (`form` voll, sieb, filter, muehle; bei Vollautomaten `milch` karaffe, schlauch, duese oder leer und `bedien` tasten, regler, display, touch; bei Siebträgern `muehle` und `bedien` tasten, manometer, touch), Größe aus `b` und `h` in Zentimetern, **alle im gleichen Maßstab** (3 px je cm). Die Zeichnung zeigt die Bauart, nie ein bestimmtes Produkt: keine Logos, keine Formen eines Herstellers nachzeichnen. Maße laut Hersteller; widersprechen sich Quellen, gilt der Hersteller (Reihenfolge der Maße prüfen: Breite, Höhe, Tiefe).
- **Aktion mit Ablauf:** `"aktion": {"bis": "JJJJ-MM-TT", "text": …, "link": …, "url": …}` zeigt einen Hinweis mit Anzeige-Kennzeichen und verschwindet nach dem Datum von selbst. Immer mit Datum im Text („stand am … für …“).
- **Finder:** Die Ergebnisse (`T` und `wahl()` im Skript von `pages/kaffee.html`) nennen Karten über ihre `id` (`m-` + id aus `kaffee.json`). Wer ein Gerät entfernt oder umbenennt, passt `T` und `tests/kaffee-test.js` an. Budget: klein bis 300, mittel bis 500, hoch bis 1.000 Euro, egal darüber.
- **Matcha** hat seit 22.11.2026 eine eigene Seite (`pages/matcha.html`, Wunsch des Inhabers): Anleitung, Werkzeug, guter Matcha, Herkunft, Koffein und Menge, Matcha-Rechner, Aufbewahren. Im Kaffee-Ratgeber steht kein Matcha-Abschnitt mehr; der Finder („Eigentlich lieber Matcha“), die Karte unter „Sieben Wege“ und eine Frage verweisen dorthin. Kopfbild ist der Matcha-Film (`kaffee-film.js`). Keine Gesundheitsversprechen (nicht zugelassen), Mengen und Messwerte nur mit Quelle. Seit 22.11.2026 mit eigenem Abschnitt „Iced Matcha Latte“ (Rezept von Ippodo: 3 g, 100 ml Wasser mit 80 Grad, 100 ml kalte Milch, Eis; Zeichnung des Glases als SVG) und einem Knopf „Lieber Matcha?“ im Kopf des Kaffee-Ratgebers. Test: `node tests/matcha-test.js`.
- Test: `node tests/kaffee-test.js [Basisadresse]` (Filme, Finder, Links, Maßbilder im gleichen Maßstab, Preisklassen, Leiste, Hinweise auf den Test ohne Noten, Vergleich, Rechner, Handy).

Alle Tests müssen mit „ALLE TESTS BESTANDEN“ enden.
