#!/usr/bin/env python3
"""Erzeugt für jedes Wandfarben-Zimmer mit Foto einen Pin (1000x1500, JPG) und ein Hochkant-Video (1080x1920, MP4, ca. 14 s, ohne Ton).
Aufruf im Quell-Ordner: python3 social/wandfarben-social.py [pin|video|beides] [slug ...]
Braucht einen laufenden lokalen Server auf dem Ausgabe-Ordner (python3 -m http.server 8766 in stil-daheim), Playwright und ffmpeg.
Ergebnis im Ausgabe-Ordner (Zweig main): assets/pins/wf-<slug>.jpg, assets/video/wf-<slug>.mp4 und assets/pins/vorrat.json (fertige Titel, Texte, Links für den Pinterest-Agenten).
Kostet kein Guthaben. Nach neuen Zimmern oder geänderten Farben einfach neu laufen lassen."""
import json, sys, pathlib, subprocess, shutil, urllib.parse, os
HERE = pathlib.Path(__file__).resolve().parent; SRC = HERE.parent
AUS = pathlib.Path(os.environ.get('STIL_OUT') or SRC.parent / 'stil-daheim'); BASIS = os.environ.get('STIL_URL', 'http://localhost:8766')
D = json.loads((SRC / 'wandfarben.json').read_text(encoding='utf-8'))['seiten']
art = sys.argv[1] if len(sys.argv) > 1 else 'beides'; nur = set(sys.argv[2:])
shutil.copy(HERE / 'wf-vorlage.html', AUS / '_wf-vorlage.html'); (AUS / 'assets/pins').mkdir(exist_ok=True); (AUS / 'assets/video').mkdir(exist_ok=True)
JS = r'''
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const jobs=JSON.parse(fs.readFileSync(process.argv[2]));const b=await chromium.launch();
for(const j of jobs){const u=j.base+'/_wf-vorlage.html#'+encodeURIComponent(JSON.stringify(j.d));
 if(j.d.art==='pin'){const p=await b.newPage({viewport:{width:1000,height:1500},deviceScaleFactor:1});await p.goto(u,{waitUntil:'networkidle'});await p.waitForTimeout(400);await p.screenshot({path:j.out,type:'jpeg',quality:88});await p.close()}
 else{const c=await b.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:1,recordVideo:{dir:j.tmp,size:{width:1080,height:1920}}});const p=await c.newPage();await p.goto(u,{waitUntil:'networkidle'});await p.waitForTimeout(500);
  const t0=Date.now();await p.evaluate(()=>los());const d=await p.evaluate(()=>dauer);await p.waitForTimeout(d);const v=await p.video().path();await c.close();fs.writeFileSync(j.tmp+'/pfad.txt',v+'\n'+((Date.now()-t0)/1000))}
 console.log(j.d.art,j.d.slug)}
await b.close()})();
'''
tmp = pathlib.Path('/tmp/wf-social'); shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir()
(tmp / 'lauf.js').write_text(JS); jobs = []; vorrat = []
for d in D:
    if nur and d['slug'] not in nur: continue
    if not (AUS / 'assets' / ('wf-%s.jpg' % d['slug'])).exists(): continue
    f = [[n, c, t, 0] for n, c, t in d['farben']]
    dunkel = max(range(4), key=lambda i: -sum(int(f[i][1][k:k + 2], 16) for k in (1, 3, 5)))      # dunkelste Farbe als zweites Pin-Bild
    a = 1 if dunkel != 1 else 0
    if art in ('pin', 'beides'):
        jobs.append({'base': BASIS, 'out': str(AUS / 'assets/pins' / ('wf-%s.jpg' % d['slug'])), 'd': {'art': 'pin', 'slug': d['slug'], 'h1': d['h1'], 'farben': f, 'a': a, 'b': dunkel}})
    if art in ('video', 'beides'):
        t = tmp / d['slug']; t.mkdir()
        jobs.append({'base': BASIS, 'tmp': str(t), 'd': {'art': 'video', 'slug': d['slug'], 'h1': d['h1'], 'farben': f + [[d['nicht'][0], d['nicht'][1], d['meiden'].split('. ')[0] + '.', 1]]}})
    vorrat.append({'datei': 'wf-%s.jpg' % d['slug'], 'video': 'assets/video/wf-%s.mp4' % d['slug'], 'titel': d['h1'].replace('Welche Wandfarbe passt zu', 'Wandfarbe zu').rstrip('?') + ': 4 Farben, die passen',
                   'text': d['antwort'] + ' #Wandfarbe #Einrichten #Farbideen', 'link': 'https://stil-daheim.de/wandfarbe-%s.html?utm_source=pinterest' % d['slug']})
(tmp / 'jobs.json').write_text(json.dumps(jobs))
subprocess.run(['node', str(tmp / 'lauf.js'), str(tmp / 'jobs.json')], check=True, cwd=str(SRC / 'tests'))
for j in jobs:
    if j['d']['art'] != 'video': continue
    v, dauer = (pathlib.Path(j['tmp']) / 'pfad.txt').read_text().split('\n')
    aus = AUS / 'assets/video' / ('wf-%s.mp4' % j['d']['slug'])
    # Anfang (Laden der Seite) abschneiden: nur die letzten <dauer> Sekunden behalten
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-sseof', '-%.2f' % float(dauer), '-i', v, '-vf', 'fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', str(aus)], check=True)
if not nur:
    (AUS / 'assets/pins/vorrat.json').write_text(json.dumps(vorrat, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(AUS / '_wf-vorlage.html').unlink()
print(len(jobs), 'Dateien erzeugt')
