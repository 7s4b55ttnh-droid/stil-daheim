// Bedientest für bilderwand.html. Aufruf: node tests/bilderwand-test.js [Basisadresse]  (ohne Adresse: http://localhost:8766)
// Muss mit „ALLE TESTS BESTANDEN“ enden.
const { chromium } = require('playwright');
const U = (process.argv[2] || 'http://localhost:8766') + '/bilderwand.html';
let bad = 0; const ok = (c, t) => { console.log((c ? 'ok ' : 'FEHLER ') + t); if (!c) bad++; };
const near = (a, b) => Math.abs(a - b) < 1e-6;
(async () => {
  const b = await chromium.launch();
  let p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const e = []; p.on('pageerror', x => e.push(x.message));
  await p.goto(U); await p.waitForTimeout(500);
  // Rechenkern
  const r = await p.evaluate(() => {
    const s = { W: 360, H: 250, mode: 'sofa', mw: 220, mh: 85, mid: 150, gap: 5, hang: 3, cols: [{ w: 40, h: 50, n: 1 }, { w: 60, h: 80, n: 1 }, { w: 40, h: 50, n: 2 }] };
    const L = BW.layout(s), f = { ...s, mode: 'frei' }, F = BW.layout(f), big = BW.layout({ ...s, cols: Array(7).fill({ w: 70, h: 100, n: 3 }) });
    return { L, F, ck: BW.checks(s, L).map(c => c.st), ckBig: BW.checks({ ...s, cols: Array(7).fill({ w: 70, h: 100, n: 3 }) }, big).map(c => c.st), rt: BW.encode(BW.decode(BW.encode({ ...s, gap: 4.5 }))), bad: [BW.decode('x'), BW.decode('360.250.sofa.220.85.150.5.3~'), BW.decode('10.250.sofa.220.85.150.5.3~30x40x1')] };
  });
  ok(near(r.L.gw, 150) && near(r.L.gh, 105), 'Gruppe 150 × 105 cm (Spalte mit zwei Rahmen: 50 + 5 + 50)');
  ok(near(r.L.gx, 105) && near(r.L.bottom, 105) && near(r.L.cy, 157.5), 'über dem Sofa: mittig, Unterkante 20 cm über der Lehne, Bildmitte 157,5 cm');
  ok(r.L.frames.length === 4 && near(r.L.frames[0].nx, 125) && near(r.L.frames[0].ny, 157.5 + 25 - 3), 'Nagel 1: Mitte des Rahmens, 3 cm unter der Oberkante');
  ok(near(r.L.frames[1].top, 197.5) && near(r.L.frames[3].top, 155) && near(r.L.frames[2].top - r.L.frames[3].top, 55), 'Spalten mittig auf der Bildmitte, in der Spalte 5 cm Abstand');
  ok(near(r.F.cy, 150) && near(r.F.gx, 105), 'freie Wand: Bildmitte 150 cm, mittig auf der Wand');
  ok(r.ck.every(s => s === 'ok'), 'Vorgabe mit passender Breite: alles in Ordnung (' + r.ck.join(',') + ')');
  ok(r.ckBig.filter(s => s === 'bad').length >= 2, 'zu große Gruppe: Fehler für Wandbreite und Decke');
  ok(r.rt === '360.250.sofa.220.85.150.4_5.3~40x50x1,60x80x1,40x50x2', 'Link-Format bleibt beim Hin und Her gleich: ' + r.rt);
  ok(r.bad.every(x => x === null), 'kaputte Links werden abgelehnt');
  // Oberfläche
  ok(await p.locator('#bw-draw svg').count() === 1 && await p.locator('#bw-tab tr').count() === 3, 'Start: Zeichnung und drei Nagelpunkte');
  ok(await p.isHidden('#bw-frei') && await p.isVisible('#bw-moebel'), 'über dem Sofa: Möbelmaße sichtbar, Bildmitte nicht');
  await p.click('#bw-mode button[data-m="frei"]');
  ok(await p.isVisible('#bw-frei') && await p.isHidden('#bw-moebel') && (await p.textContent('#bw-t2')) === '150 cm', 'freie Wand: Bildmitte 150 cm einstellbar');
  await p.fill('#bw-mid', '145'); ok((await p.textContent('#bw-t2')) === '145 cm', 'Bildmitte ändert den Plan sofort');
  await p.click('#bw-pre button[data-i="1"]');
  ok(await p.locator('#bw-tab tr').count() === 6 && await p.locator('#bw-cols li').count() === 3, 'Vorlage Raster: 6 Rahmen in 3 Spalten');
  await p.click('#bw-cols li:nth-child(1) [data-a="n"]'); ok(await p.locator('#bw-tab tr').count() === 7, '„übereinander“ zählt weiter (3 in Spalte 1)');
  await p.selectOption('#bw-cols li:nth-child(2) select', '70x50'); ok((await p.textContent('#bw-tab')).includes('70 × 50'), 'Format wählbar, auch quer');
  await p.click('#bw-add'); await p.click('#bw-cols li:nth-child(4) [data-a="x"]'); ok(await p.locator('#bw-cols li').count() === 3, 'Spalte dazu und wieder weg');
  await p.fill('#bw-gap', '7,5'); ok((await p.textContent('#bw-ck')).includes('7,5'), 'Abstand mit Komma');
  await p.fill('#bw-w', '100'); ok(await p.locator('#bw-ck li.bad').count() >= 1, 'schmale Wand: Fehler wird gemeldet');
  await p.fill('#bw-w', '360');
  const link = await p.evaluate(() => location.origin + location.pathname + '?b=' + BW.encode(BW.state()));
  const p2 = await b.newPage({ viewport: { width: 390, height: 844 } }); const e2 = []; p2.on('pageerror', x => e2.push(x.message));
  await p2.goto(link); await p2.waitForTimeout(500);
  ok((await p2.inputValue('#bw-gap')) === '7,5' && await p2.locator('#bw-tab tr').count() === 7 && (await p2.getAttribute('#bw-mode button[data-m="frei"]', 'aria-pressed')) === 'true', 'geteilter Link öffnet denselben Plan');
  ok(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitliches Scrollen');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#bw-img'); const got = await dl;
  ok(got && got.suggestedFilename() === 'bilderwand.png', 'Plan als Bild speichern');
  await p.reload(); await p.waitForTimeout(400); ok((await p.inputValue('#bw-gap')) === '7,5', 'Plan bleibt nach dem Neuladen erhalten');
  ok(e.length + e2.length === 0, 'keine Skriptfehler ' + e.concat(e2).join('|'));
  await b.close(); console.log(bad ? '\n' + bad + ' FEHLER' : '\nALLE TESTS BESTANDEN'); process.exit(bad ? 1 : 0);
})();
