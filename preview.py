"""Packt die gebaute Website als Vorschau-Artefakt: Startseite ohne eigenes Grundgerüst, alle anderen Dateien daneben."""
import pathlib, shutil, re
SRC = pathlib.Path('/home/claude/stil-daheim')
OUT = pathlib.Path('/tmp/claude-0/-home-claude/9e0351cc-45dc-5c59-bff1-529ce2c8a069/scratchpad/sd-artifact')
if OUT.exists(): shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)
p = (OUT / 'index.html').read_text()
p = p.replace('<!doctype html><html lang="de"><head><meta charset="utf-8">', '<meta name="claude:viewport-fit-sides" content="cover">\n<script>document.documentElement.lang="de"</script>', 1)
p = p.replace('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n', '', 1)
p = re.sub(r'<title>.*?</title>', '<title>Stil-Daheim</title>', p, count=1)
p = p.replace('</head><body>\n', '\n', 1)
p = p.replace('</body></html>\n', '', 1)
assert '<html' not in p and '<body' not in p and '</head>' not in p, 'Grundgerüst nicht vollständig entfernt'
(OUT / 'index.html').rename(OUT / 'index-voll.html')
(OUT / 'startseite.html').write_text(p)
files = sorted(str(f.relative_to(OUT)) for f in OUT.rglob('*') if f.is_file() and f.name not in ('startseite.html', 'index-voll.html') and f.suffix != '.txt')
print('\n'.join(files))
print(len(files), 'Dateien,', sum((OUT / f).stat().st_size for f in files) // 1024, 'KB')
