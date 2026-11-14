// Bedientest für farbpalette.html. Aufruf: node tests/farbpalette-test.js [Basisadresse]  (ohne Adresse: http://localhost:8766)
// Muss mit „ALLE TESTS BESTANDEN“ enden.
const { chromium } = require('playwright');
const U = (process.argv[2] || 'http://localhost:8766') + '/farbpalette.html';
let bad = 0; const ok = (c, t) => { console.log((c ? 'ok ' : 'FEHLER ') + t); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push(x.message));
  let ext = 0; p.on('request', r => { if (!r.url().startsWith(U.replace(/\/farbpalette\.html$/, '')) && !r.url().startsWith('data:') && !r.url().startsWith('blob:') && !/goatcounter|gc\.zgo/.test(r.url())) ext++; });
  await p.goto(U); await p.waitForFunction(() => document.querySelectorAll('#fp-sw button').length > 0, null, { timeout: 8000 });
  ok(await p.locator('#fp-sw button').count() >= 3, 'Beispielfoto ist beim Start ausgewertet');
  await p.waitForTimeout(400); ok(await p.evaluate(() => { const m = document.querySelector('#fp-drop>.ki-marke'); return !!m && getComputedStyle(m).display !== 'none'; }) && (await p.textContent('.fp-demo')).includes('mit Hilfe von KI erstellt'), 'Beispielfoto ist als KI-Bild gekennzeichnet');
  // Rechenkern mit einem gestellten Bild: 60 % hell, 30 % grün, 10 % orange
  const r = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 100; c.height = 100; const x = c.getContext('2d');
    x.fillStyle = '#EDEAE2'; x.fillRect(0, 0, 100, 60); x.fillStyle = '#2F5D50'; x.fillRect(0, 60, 100, 30); x.fillStyle = '#C8552B'; x.fillRect(0, 90, 100, 10);
    const pal = FP.palette(x.getImageData(0, 0, 100, 100).data), R = FP.roles(pal), W = FP.walls(R);
    return { pal: pal.map(q => [q.hex, Math.round(q.share * 100)]), main: R.main.hex, sec: R.sec.hex, acc: R.acc.hex, walls: W.map(w => FP.lab(...w.c.rgb)[0]), rt: FP.hex(FP.rgb(...FP.lab(47, 93, 80))), empty: FP.palette(new Uint8ClampedArray(400)).length };
  });
  ok(r.pal.length === 3 && r.pal[0][1] === 60 && r.pal[1][1] === 30 && r.pal[2][1] === 10, 'drei Flächen werden mit 60, 30 und 10 % erkannt: ' + JSON.stringify(r.pal));
  ok(r.main === '#EDEAE2' && r.sec === '#2F5D50' && r.acc === '#C8552B', 'Rollen: Hauptfarbe hell, Nebenfarbe grün, Akzent orange');
  ok(r.walls[0] > 88 && r.walls[1] > 55 && r.walls[1] < 78 && r.walls[2] < 40, 'Wand-Vorschläge hell, mittel, dunkel (L ' + r.walls.map(Math.round).join(', ') + ')');
  ok(r.rt === '#2F5D50' && r.empty === 0, 'Farbumrechnung hin und zurück stimmt, leeres Bild ergibt keine Farben');
  // eigenes Foto
  const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#103A5C'; x.fillRect(0, 0, 300, 140); x.fillStyle = '#E8D9B5'; x.fillRect(0, 140, 300, 60); return c.toDataURL('image/png').split(',')[1]; });
  await p.setInputFiles('#fp-file', { name: 'zimmer.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await p.waitForFunction(() => document.getElementById('fp-msg').textContent.includes('ausgewertet'), null, { timeout: 8000 });
  ok((await p.getAttribute('#fp-sw button:first-child', 'data-hex')) === '#103A5C', 'eigenes Foto: Hauptfarbe ist das Blau des Bildes');
  ok(await p.locator('.fp-demo button[aria-pressed="true"]').count() === 0, 'Beispiel ist nicht mehr markiert');
  ok(await p.evaluate(() => { const m = document.querySelector('#fp-drop>.ki-marke'); return !m || getComputedStyle(m).display === 'none'; }), 'eigenes Foto trägt keine KI-Marke');
  ok(await p.locator('#fp-wall button').count() === 3 && (await p.textContent('#fp-stil')).includes('Am nächsten liegt'), 'Wand-Vorschläge und Wohnstil stehen da');
  await p.click('#fp-sw button:first-child'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => navigator.clipboard.readText())) === '#103A5C', 'Antippen kopiert den Farbwert');
  await p.click('#fp-copy'); await p.waitForTimeout(200);
  ok(/^#103A5C, #E8D9B5/.test(await p.evaluate(() => navigator.clipboard.readText())), 'alle Farbwerte kopieren');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#fp-img'); const got = await dl;
  ok(got && got.suggestedFilename() === 'farbpalette.png', 'Palette als Bild speichern');
  await p.setInputFiles('#fp-file', { name: 'notiz.txt', mimeType: 'text/plain', buffer: Buffer.from('kein Bild') });
  ok((await p.textContent('#fp-msg')).includes('kein Bild'), 'keine Bilddatei: verständliche Meldung');
  await p.click('.fp-demo button:nth-child(3)'); await p.waitForTimeout(900);
  ok((await p.getAttribute('.fp-demo button:nth-child(3)', 'aria-pressed')) === 'true' && await p.locator('#fp-sw button').count() >= 3, 'Beispiel wechseln');
  ok(ext === 0, 'keine Abrufe bei fremden Servern (' + ext + ')');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 }); await m.goto(U); await m.waitForTimeout(900);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitliches Scrollen');
  ok(e.length === 0, 'keine Skriptfehler ' + e.join('|'));
  await b.close(); console.log(bad ? '\n' + bad + ' FEHLER' : '\nALLE TESTS BESTANDEN'); process.exit(bad ? 1 : 0);
})();
