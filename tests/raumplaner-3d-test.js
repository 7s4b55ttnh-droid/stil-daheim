// Test der 3D-Ansicht im Raumplaner. Aufruf: node tests/raumplaner-3d-test.js [Basisadresse]  (ohne Adresse: http://localhost:8766)
// Muss mit „ALLE TESTS BESTANDEN“ enden.
const { chromium } = require('playwright');
const U = (process.argv[2] || 'http://localhost:8766') + '/raumplaner.html';
let bad = 0; const ok = (c, t) => { console.log((c ? 'ok ' : 'FEHLER ') + t); if (!c) bad++; };
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 900 } }); const e = []; p.on('pageerror', x => e.push(x.message));
  await p.goto(U); await p.waitForTimeout(900);
  ok(await p.isHidden('#rp-3d') && await p.isHidden('#rp-3d-rot'), 'Start: Plan sichtbar, 3D-Ansicht aus');
  await p.click('#rp-3d-btn'); await p.waitForTimeout(300);
  const clean = () => p.evaluate(() => { const s = document.querySelector('#rp-3d svg'); return !!s && !/NaN|undefined/.test(s.innerHTML) && s.querySelectorAll('polygon').length; });
  const n0 = await clean();
  ok(n0 > 20 && await p.isVisible('#rp-3d-rot') && (await p.textContent('#rp-3d-btn')).trim() === 'Zum Plan', '3D-Ansicht zeigt Raum und Möbel (' + n0 + ' Flächen), Knopf heißt „Zum Plan“');
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('rp-plan')).visibility === 'hidden') && await p.isHidden('#rp-tool'), 'Plan und Werkzeugleiste sind in der 3D-Ansicht ausgeblendet');
  ok(await p.evaluate(() => document.querySelector('#rp-3d svg').getBoundingClientRect().height <= innerHeight - 200), 'Ansicht passt in den Bildschirm');
  const before = await p.evaluate(() => document.querySelector('#rp-3d svg').innerHTML);
  let all = true;
  for (let i = 0; i < 4; i++) { await p.click('#rp-3d-rot'); await p.waitForTimeout(120); all = all && !!(await clean()); }
  ok(all && (await p.evaluate(() => document.querySelector('#rp-3d svg').innerHTML)) === before, 'vier Mal drehen: jede Seite zeichnet sauber, danach wieder die erste');
  await p.click('#rp-tabs button[data-g="3"]'); await p.click('#rp-cat button[data-t="bett140"]'); await p.waitForTimeout(300);
  ok((await clean()) > n0, 'Möbel aus dem Katalog erscheint sofort in der 3D-Ansicht');
  const types = await p.evaluate(() => Array.from(document.getElementById('rp-type').children).map(o => o.getAttribute('data-t')));
  let fine = true;
  for (const t of types) { await p.click('#rp-type button[data-t="' + t + '"]'); await p.waitForTimeout(350); for (let i = 0; i < 2; i++) { await p.click('#rp-3d-rot'); await p.waitForTimeout(100); fine = fine && (await clean()) > 2; } }
  await p.click('#rp-type button[data-t="wohnen"]'); await p.waitForTimeout(350);
  ok(fine, 'alle Raumarten (' + types.length + ') zeichnen ohne Fehler');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#rp-3d-pic'); const got = await dl;
  ok(got && got.suggestedFilename() === 'zimmer-3d.png', '3D-Ansicht als Bild speichern');
  await p.click('#rp-3d-btn'); await p.waitForTimeout(300);
  ok(await p.isHidden('#rp-3d') && await p.locator('#rp-plan svg .rp-it, #rp-plan svg [data-id]').count() > 0 && await p.evaluate(() => getComputedStyle(document.getElementById('rp-plan')).visibility === 'visible'), 'zurück zum Plan: Möbel lassen sich wieder bearbeiten');
  const allKinds = await p.evaluate(() => { const S = RP.state(); let bad = []; for (const t in RP.CAT) { const it = { id: 999, t, x: 10, y: 10, w: RP.CAT[t].w, h: RP.CAT[t].h, r: 1, flip: 0 }; try { const ps = RP3.parts(it); if (!ps.length || ps.some(q => [q.u0, q.v0, q.u1, q.v1, q.z0, q.z1].some(v => !isFinite(v)) || q.z1 <= q.z0)) bad.push(t); } catch (x) { bad.push(t + '!'); } } return bad; });
  ok(allKinds.length === 0, 'alle Möbelarten des Katalogs haben eine 3D-Form' + (allKinds.length ? ': ' + allKinds.join(',') : ''));
  const m = await b.newPage({ viewport: { width: 390, height: 844 } }); const e2 = []; m.on('pageerror', x => e2.push(x.message));
  await m.goto(U); await m.waitForTimeout(900); await m.click('#rp-3d-btn'); await m.waitForTimeout(300);
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) && await m.isVisible('#rp-3d svg'), 'Handy: 3D-Ansicht ohne seitliches Scrollen');
  ok(e.length + e2.length === 0, 'keine Skriptfehler ' + e.concat(e2).join('|'));
  await b.close(); console.log(bad ? '\n' + bad + ' FEHLER' : '\nALLE TESTS BESTANDEN'); process.exit(bad ? 1 : 0);
})();
