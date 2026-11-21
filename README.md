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

Alle Tests müssen mit „ALLE TESTS BESTANDEN“ enden.
