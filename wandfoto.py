#!/usr/bin/env python3
"""Macht aus einem Zimmerfoto und seinem Hilfsbild die zwei Dateien für eine Wandfarben-Seite.
Aufruf: python3 wandfoto.py <slug> <foto.png> <hilfsbild.png>
- foto.png: fotorealistisches Zimmer 16:9 mit glatter, neutral weißer Wand (KI-Bild, keine Menschen, keine Marken).
- hilfsbild.png: dasselbe Bild, per Bild-Bearbeitung alle Wandflächen flach in reinem Magenta #FF00FF gestrichen, sonst unverändert.
Ergebnis im Ausgabe-Ordner (Zweig main): assets/wf-<slug>.jpg und assets/wf-<slug>-maske.png.
WICHTIG: Beide Dateien zuerst im Zweig main committen, dann bauen. Danach die Vorschau ansehen (Kanten an Möbeln, Rahmen, Fußleisten)."""
import sys, os, pathlib, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
HERE = pathlib.Path(__file__).resolve().parent
ZIEL = pathlib.Path(os.environ.get('STIL_OUT') or HERE.parent / 'stil-daheim') / 'assets'
sl, foto, hilf = sys.argv[1:4]
a = Image.open(foto).convert('RGB'); m = Image.open(hilf).convert('RGB').resize(a.size)
A = np.asarray(a).astype(float); M = np.asarray(m).astype(float); r, g, b = M[..., 0], M[..., 1], M[..., 2]
mask = (r > 150) & (b > 150) & (g < 120) & (np.abs(r - b) < 80)
mask = ndi.binary_closing(ndi.binary_opening(mask, iterations=1), iterations=1)
lab, n = ndi.label(mask)
for i, v in enumerate(ndi.sum(mask, lab, range(1, n + 1))):
    if v < 150: mask[lab == i + 1] = False               # winzige Inseln entfernen
al = Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
out = Image.new('RGBA', a.size, (255, 255, 255, 0)); out.putalpha(al); out.save(ZIEL / ('wf-%s-maske.png' % sl), optimize=True)
a.save(ZIEL / ('wf-%s.jpg' % sl), quality=84, optimize=True, progressive=True)
al01 = np.asarray(al).astype(float)[..., None] / 255; c = np.array([0x2F, 0x5D, 0x62], float)
Image.fromarray((A * (1 - al01) + (A * c / 255) * al01).astype('uint8')).save('/tmp/wf-vorschau-%s.jpg' % sl, quality=80)
print('%s: Wand %.1f %%, Abweichung außerhalb der Wand %.1f (unter 12 ist gut). Vorschau: /tmp/wf-vorschau-%s.jpg' % (sl, mask.mean() * 100, np.abs(M - A).mean(2)[~mask].mean(), sl))
