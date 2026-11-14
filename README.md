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

Alle Tests müssen mit „ALLE TESTS BESTANDEN“ enden.
