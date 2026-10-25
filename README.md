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
