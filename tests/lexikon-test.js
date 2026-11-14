// Bedientest fürs Lexikon von Stil-Daheim. Aufruf: node tests/lexikon-test.js [Basisadresse]  (ohne Adresse: http://localhost:8766)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8766';
let bad = 0; const ok = (c, t) => { console.log((c ? 'ok   ' : 'FEHLER ') + t); if (!c) bad++; };
(async () => {
  const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lexikon.json'), 'utf8')).begriffe;
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/lexikon.html'); await p.waitForTimeout(900);
  ok(await p.locator('.lx-item').count() === D.length, 'Lexikon zeigt alle ' + D.length + ' Begriffe');
  ok(await p.locator('.lx').count() === 0, 'im Lexikon selbst keine Markierungen');
  await p.fill('#lx-find', 'hängung'); ok(await p.locator('.lx-item:visible').count() === 2, 'Suche filtert auf zwei Hängungen');
  await p.fill('#lx-find', 'xyzxyz'); ok(await p.isVisible('#lx-none'), 'Suche ohne Treffer: Hinweis');
  let dead = 0; for (const h of new Set(await p.locator('.lx-l a').evaluateAll(a => a.map(x => x.getAttribute('href'))))) if ((await p.evaluate(u => fetch(u).then(r => r.status).catch(() => 0), BASE + '/' + h)) !== 200) dead++;
  ok(dead === 0, 'alle Links im Lexikon gehen');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitliches Scrollen');
  await p.goto(BASE + '/wohnzimmer.html'); await p.waitForTimeout(1300);
  const n = await p.locator('.lx').count(); ok(n >= 1 && n <= 8, 'Ratgeber Wohnzimmer: ' + n + ' Begriffe markiert: ' + (await p.locator('.lx').allTextContents()).join(', '));
  await p.locator('.lx').first().scrollIntoViewIfNeeded(); await p.locator('.lx').first().click(); await p.waitForTimeout(250);
  ok(await p.isVisible('.lx-pop') && /lexikon\.html#/.test(await p.getAttribute('.lx-pop a', 'href')), 'Antippen zeigt die Erklärung mit Link ins Lexikon');
  const href = await p.getAttribute('.lx-pop a', 'href'); await p.goto(BASE + '/' + href); await p.waitForTimeout(400);
  ok(await p.locator('.lx-item:target').count() === 1, 'Link springt zum Begriff');
  ok(errs.length === 0, 'keine Skriptfehler ' + errs.join('|'));
  await b.close(); console.log(bad ? '\n' + bad + ' FEHLER' : '\nALLE TESTS BESTANDEN'); process.exit(bad ? 1 : 0);
})();
