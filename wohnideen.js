/* Stil-Daheim: Wohnideen zum Stöbern (wohnideen.html, seit 21.11.2026, Wunsch des Inhabers: „süchtig machen zu schauen“).
   Ein Raum pro Bildschirm. Der <body> rollt und rastet je Raum ein (CSS in wohnideen.html), dieses Skript macht den Rest:
   - merkt, welcher Raum gerade dran ist (Zähler oben, Adresse #raum-…, Nachbarbilder vorladen)
   - Kamerafahrt im Hochformat: Das Bild fährt langsam zur Seite und lässt sich mit dem Finger ziehen
   - Merken (Herz oder zweimal schnell tippen), gespeichert nur im Browser unter „sdmerk“
   - Farbkarte des Raums: fünf Farben aus dem Foto, Antippen kopiert den Farbwert (site.js), Link ins Wandfarben-Studio
   - „Alle Räume“: Übersicht mit Filtern, gemerkte Räume und daraus die eigene Farbwelt mit dem nächstgelegenen Wohnstil
   - Tastatur: Pfeile, Bild auf/ab, Leertaste, Pos1, Ende, M = merken
   Ohne Skript bleibt die Seite ein Stapel aus Bildern mit Tipp und Links. „Bewegung reduzieren“ schaltet alle Fahrten ab.
   Die Räume selbst (Foto, Tipp, Farben) kommen aus build.py, Abschnitt WOHNIDEEN. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body, ed = d.getElementById('ed'), ende = d.getElementById('ende');
  if (!ed || !ende) return;
  var S = [].slice.call(ed.querySelectorAll('.ed-s[data-n]'));
  if (!S.length) return;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, HOCH = matchMedia('(max-aspect-ratio: 4/5)');
  var by = {}, akt = null, ruhe = RM, wechsel = 0;
  S.forEach(function (s) { by[s.dataset.n] = s; });
  root.classList.add('ed-js');
  var nr = d.getElementById('ed-nr'), ges = d.getElementById('ed-n'), bz = d.getElementById('ed-bz'), ft = d.querySelector('body>footer');

  var HERZ = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S4.6 15.9 4.6 10.3a4 4 0 0 1 7.4-2.2 4 4 0 0 1 7.4 2.2c0 5.6-7.4 10.1-7.4 10.1z"/></svg>',
    TEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    AB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

  /* ---------- Farben ---------- */
  function farben(s) { return (s.getAttribute('data-p') || '').split(',').map(function (t) { var i = t.lastIndexOf('#'); return [t.slice(0, i), t.slice(i)]; }).filter(function (c) { return /^#[0-9a-f]{6}$/i.test(c[1]); }); }
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function hell(h) {                                   /* schwarze oder weiße Schrift: was auf der Farbe den größeren Kontrast hat (so sind es immer mindestens 4,5 zu 1) */
    var c = rgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }), L = .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
    return (L + .05) / .05 > 1.05 / (L + .05);
  }
  function lab(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }),
      f = function (t) { return t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; },
      x = f((c[0] * .4124 + c[1] * .3576 + c[2] * .1805) / .95047), y = f(c[0] * .2126 + c[1] * .7152 + c[2] * .0722), z = f((c[0] * .0193 + c[1] * .1192 + c[2] * .9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function unlab(l) {
    var y = (l[0] + 16) / 116, x = l[1] / 500 + y, z = y - l[2] / 200, g = function (t) { return t * t * t > .008856 ? t * t * t : (t - 16 / 116) / 7.787; };
    x = g(x) * .95047; y = g(y); z = g(z) * 1.08883;
    var c = function (v) { v = v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055; return ('0' + Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16)).slice(-2); };
    return '#' + c(x * 3.2406 + y * -1.5372 + z * -.4986) + c(x * -.9689 + y * 1.8758 + z * .0415) + c(x * .0557 + y * -.204 + z * 1.057);
  }
  function dE(p, q) { var a = p[0] - q[0], b = p[1] - q[1], c = p[2] - q[2]; return Math.sqrt(a * a + b * b + c * c); }
  function studio(P) { return 'wandfarbe-testen.html?mix=' + P.slice(0, 6).map(function (c) { return c[1].slice(1) + '-' + encodeURIComponent(c[0]); }).join(','); }
  function feld(c, i) {
    var H = c[1].toUpperCase();
    return '<span class="ed-sw" style="--i:' + i + '"><button type="button" data-hex="' + H + '" aria-label="' + c[0] + ', Farbwert ' + H + ' kopieren" style="background:' + c[1] + ';color:' + (hell(c[1]) ? '#000' : '#fff') + '"><b>' + c[0] + '</b><em>' + H + '</em></button></span>';
  }

  /* ---------- Merken ---------- */
  var KEY = 'sdmerk', M = [];
  try { var roh = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(roh)) M = roh.filter(function (x) { return typeof x === 'string'; }).slice(0, 300); } catch (e) {}
  function sichern() { try { localStorage.setItem(KEY, JSON.stringify(M)); } catch (e) {} }
  function da() { return M.filter(function (n) { return by[n]; }); }
  function zeigHerz(s) {
    var b = s.querySelector('.ed-herz'); if (!b) return;
    var an = M.indexOf(s.dataset.n) >= 0;
    b.setAttribute('aria-pressed', an ? 'true' : 'false');
    b.setAttribute('aria-label', an ? 'Gemerkt. Antippen entfernt den Raum aus deinen gemerkten' : 'Raum merken');
  }
  function zaehl() {
    var N = da(), n = N.length, c = d.querySelector('#ed-af [data-f="gm"]'), eg = d.getElementById('ed-egm');
    if (bz) { bz.hidden = !n; bz.textContent = n; }
    if (c) c.textContent = n ? 'Gemerkt (' + n + ')' : 'Gemerkt';
    if (eg) {                                             /* am Ende: die zuletzt gemerkten Räume als kleine Bilder */
      eg.hidden = !n;
      eg.innerHTML = n ? '<b>' + (n === 1 ? 'Dein gemerkter Raum' : 'Deine ' + n + ' gemerkten Räume') + '</b><div class="ed-egl">' + N.slice(-6).reverse().map(function (x) {
        var im = by[x].querySelector('.ed-b img'); return '<a href="#' + by[x].id + '"><img src="assets/' + x + '-t.webp" alt="' + (im ? im.alt.replace(/"/g, '&quot;') : '') + '" loading="lazy" decoding="async"></a>';
      }).join('') + '</div>' : '';
    }
  }
  function merke(s, an) {
    var n = s.dataset.n, i = M.indexOf(n), neu = an === undefined ? i < 0 : an;
    if (neu === (i >= 0)) return false;
    if (neu) M.push(n); else M.splice(i, 1);
    sichern(); zeigHerz(s); zaehl();
    var b = s.querySelector('.ed-herz');
    if (neu && b && !RM) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    if (window.sdToast) window.sdToast(neu ? (da().length === 1 ? 'Gemerkt. Du findest den Raum unter „Alle Räume“' : 'Gemerkt') : 'Nicht mehr gemerkt');
    return true;
  }
  function puff(s, x, y) {
    if (RM) return;
    var r = s.getBoundingClientRect(), p = d.createElement('span');
    p.className = 'ed-puff'; p.setAttribute('aria-hidden', 'true'); p.innerHTML = HERZ;
    p.style.left = (x - r.left) + 'px'; p.style.top = (y - r.top) + 'px';
    s.appendChild(p); setTimeout(function () { p.remove(); }, 900);
  }

  /* ---------- Jeder Raum bekommt seine Knöpfe und (auf Wunsch) seine Farbkarte ---------- */
  S.forEach(function (s) {
    var tipp = s.querySelector('h2').textContent.replace(/\s+/g, ' ').trim(), a = d.createElement('div');
    a.className = 'ed-a';
    a.innerHTML = '<button type="button" class="ed-herz" aria-pressed="false">' + HERZ + '</button><button type="button" class="ed-teil" data-share="" aria-label="Diesen Raum teilen">' + TEIL + '</button><button type="button" class="ed-vor" aria-label="Nächster Raum">' + AB + '</button>';
    var t = a.querySelector('.ed-teil');
    t.setAttribute('data-share-text', 'Wohnidee von Stil-Daheim: ' + tipp);
    t.setAttribute('data-share-url', location.origin + location.pathname + '#' + s.id);
    s.appendChild(a); zeigHerz(s);
    var pal = s.querySelector('a.ed-pal');
    if (pal) {
      var k = d.createElement('button'); k.type = 'button'; k.className = 'ed-pal'; k.innerHTML = pal.innerHTML;
      k.setAttribute('aria-expanded', 'false'); k.setAttribute('aria-controls', 'fk-' + s.dataset.n); k.setAttribute('aria-label', 'Farben dieses Raums zeigen');
      pal.parentNode.replaceChild(k, pal);
    }
  });
  function karte(s) {
    var fk = s.querySelector('.ed-fk'); if (fk) return fk;
    var P = farben(s); fk = d.createElement('div'); fk.className = 'ed-fk'; fk.id = 'fk-' + s.dataset.n; fk.hidden = true;
    fk.innerHTML = '<div class="ed-fks">' + P.map(feld).join('') + '</div><p><a href="' + studio(P) + '">Im Wandfarben-Studio an die Wand bringen</a><span>Aus dem Foto gezogen. Antippen kopiert den Farbwert.</span></p>';
    s.querySelector('.ed-l').insertAdjacentElement('beforebegin', fk);
    return fk;
  }
  function karteZu(s) { var fk = s && s.querySelector('.ed-fk'), k = s && s.querySelector('.ed-pal'); root.classList.remove('ed-fkauf'); if (fk && !fk.hidden) { fk.hidden = true; if (k) k.setAttribute('aria-expanded', 'false'); } }

  /* ---------- Welcher Raum ist dran ---------- */
  function liste() { return S.concat([ende]); }
  function stelle() { return Math.max(0, Math.min(S.length, Math.round(body.scrollTop / Math.max(1, body.clientHeight)))); }
  function zu(el, sofort) {                             /* sofort: ohne Fahrt (direkt über scrollTop, das können alle Browser) */
    if (!el) return;
    if (sofort || RM || !el.scrollIntoView) body.scrollTop = el.offsetTop; else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  /* Einen Raum weiter (r = 1) oder zurück (r = -1). Gibt false zurück, wenn der Browser selbst rollen soll:
     in einer Fußzeile, die höher ist als der Bildschirm. */
  function geh(r) {
    var L = liste(), i = stelle(), H = body.clientHeight;
    if (ft) {
      var f = ft.getBoundingClientRect();
      if (f.top < H * .6) {                                                  /* Fußzeile ist dran */
        if (f.height > H + 4 && (r > 0 || f.top < -4)) return false;
        if (r < 0) zu(ende);
        return true;
      }
    }
    if (r > 0 && i >= L.length - 1) { if (ft) zu(ft); return true; }
    zu(L[Math.max(0, Math.min(L.length - 1, i + r))]);
    return true;
  }
  function vor(i) { for (var k = -1; k <= 2; k++) { var s = S[i + k]; if (!s || s.__vor) continue; s.__vor = 1; var im = s.querySelector('.ed-b img'); if (im && im.loading === 'lazy') im.loading = 'eager'; } }
  function setAkt(s) {
    if (s === akt) return;
    var alt = akt;
    if (alt) { alt.classList.remove('akt'); karteZu(alt); }
    akt = s; s.classList.add('akt', 'war');
    if (alt && alt.__im && alt.__x != null && alt.__m && alt.__m.max && HOCH.matches && !alt.classList.contains('ed-film')) setz(alt, alt.__x);
    var i = S.indexOf(s);
    if (i >= 0) {
      if (nr) nr.textContent = i + 1;
      vor(i);
      try { history.replaceState(history.state, '', '#' + s.id); } catch (e) {}
      if (!s.classList.contains('ed-film')) { grund(s); if (s.__dir == null && s.__m) s.__dir = s.__x < s.__m.max / 2 ? 1 : -1; s.__halt = performance.now() + 500; los(); }
    }
    else if (nr) nr.textContent = S.length;              /* Abschluss: Zähler steht auf dem letzten Raum */
    if (++wechsel > 1) { var h = d.querySelector('.ed-hint'); if (h) h.remove(); }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('sicht', e.isIntersecting); if (e.intersectionRatio >= .6) setAkt(e.target); });
    }, { threshold: [0, .6] });
    liste().forEach(function (s) { io.observe(s); });
    if (ft) new IntersectionObserver(function (es) { root.classList.toggle('ed-unten', es[0].intersectionRatio > .25); }, { threshold: [0, .25, .5] }).observe(ft);
  } else S.forEach(function (s) { s.classList.add('war', 'sicht'); });

  /* ---------- Kamerafahrt im Hochformat ---------- */
  var raf = 0, zuletzt = 0, zieht = false;
  function masse(s) {
    var im = s.__im || (s.__im = s.querySelector('.ed-b img')), W = s.clientWidth, H = s.clientHeight, w = H * (+im.getAttribute('width') || 16) / (+im.getAttribute('height') || 9);
    return (s.__m = { W: W, w: w, max: Math.max(0, w - W) });
  }
  /* Nur der Raum, der gerade dran ist, bekommt eine eigene Ebene (translate3d); alle anderen bleiben flach, das schont den Speicher des Handys. */
  function setz(s, x) { s.__x = x; s.__im.style.transform = s === akt ? 'translate3d(' + (-x).toFixed(1) + 'px,0,0)' : 'translateX(' + (-x).toFixed(1) + 'px)'; }
  function grund(s) {
    if (s.classList.contains('ed-film')) return;
    var m = masse(s);
    if (!HOCH.matches || !m.max) { s.__im.style.transform = ''; return; }
    var x = s.__x == null || s.__W !== m.W ? parseFloat(s.dataset.fx || '.5') * m.w - m.W / 2 : s.__x;
    s.__W = m.W; setz(s, Math.max(0, Math.min(m.max, x)));
  }
  function lauf(t) {
    raf = 0;
    var s = akt, m = s && s.__m;
    if (!s || ruhe || zieht || d.hidden || !HOCH.matches || !m || !m.max || s.classList.contains('ed-film')) return;
    var dt = Math.min(64, t - (zuletzt || t)); zuletzt = t;
    if (!s.__halt || t >= s.__halt) {
      var r = s.__dir || 1, rand = Math.min(s.__x, m.max - s.__x), v = 24 * (.22 + .78 * Math.min(1, rand / 80)), x = s.__x + r * v * dt / 1000;
      if (x >= m.max) { x = m.max; s.__dir = -1; s.__halt = t + 900; } else if (x <= 0) { x = 0; s.__dir = 1; s.__halt = t + 900; }
      setz(s, x);
    }
    raf = requestAnimationFrame(lauf);
  }
  function los() { zuletzt = 0; if (!raf && !ruhe) raf = requestAnimationFrame(lauf); }
  function alleGrund() { S.forEach(function (s) { s.__W = null; grund(s); }); los(); }
  alleGrund();
  var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(alleGrund, 120); });
  if (HOCH.addEventListener) HOCH.addEventListener('change', alleGrund);
  d.addEventListener('visibilitychange', function () { if (!d.hidden) los(); });

  /* Ziehen (seitlich) und Doppeltipp (merken). Hoch und runter bleibt dem Browser überlassen (touch-action: pan-y). */
  var p0 = null, tipp0 = null;
  function bild(e) { var s = e.target.closest && e.target.closest('.ed-s[data-n]'); return s && !e.target.closest('a,button,.ed-fk') ? s : null; }
  ed.addEventListener('pointerdown', function (e) { var s = bild(e); if (!s || (e.pointerType === 'mouse' && e.button !== 0)) { p0 = null; return; } p0 = { s: s, x: e.clientX, y: e.clientY, x0: s.__x || 0, id: e.pointerId, an: false, t: e.timeStamp }; });
  ed.addEventListener('pointermove', function (e) {
    if (!p0 || e.pointerId !== p0.id) return;
    var dx = e.clientX - p0.x, dy = e.clientY - p0.y, m = p0.s.__m;
    if (!p0.an) { if (!HOCH.matches || !m || !m.max || p0.s.classList.contains('ed-film') || Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return; p0.an = true; zieht = true; }
    setz(p0.s, Math.max(0, Math.min(m.max, p0.x0 - dx)));
  });
  function hoch(e) {
    if (!p0 || e.pointerId !== p0.id) return;
    var p = p0; p0 = null;
    if (p.an) { zieht = false; p.s.__dir = e.clientX < p.x ? 1 : -1; p.s.__halt = performance.now() + 2400; los(); return; }
    if (e.type !== 'pointerup' || Math.abs(e.clientX - p.x) > 12 || Math.abs(e.clientY - p.y) > 12 || e.timeStamp - p.t > 400) { tipp0 = null; return; }
    if (tipp0 && tipp0.s === p.s && e.timeStamp - tipp0.t < 340 && Math.abs(e.clientX - tipp0.x) < 40 && Math.abs(e.clientY - tipp0.y) < 40) { tipp0 = null; merke(p.s, true); puff(p.s, e.clientX, e.clientY); }
    else tipp0 = { s: p.s, x: e.clientX, y: e.clientY, t: e.timeStamp };
  }
  ed.addEventListener('pointerup', hoch); ed.addEventListener('pointercancel', hoch);
  ed.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---------- Klicks in den Räumen ---------- */
  ed.addEventListener('click', function (e) {
    var s = e.target.closest('.ed-s'), b = e.target.closest('button,a'); if (!s || !b) return;
    var hi = d.querySelector('.ed-hint'); if (hi) hi.remove();
    if (b.classList.contains('ed-herz')) { merke(s); return; }
    if (b.classList.contains('ed-vor')) { geh(1); return; }
    if (b.classList.contains('ed-pal') && b.tagName === 'BUTTON') {
      var fk = karte(s), auf = fk.hidden; fk.hidden = !auf; b.setAttribute('aria-expanded', auf ? 'true' : 'false'); root.classList.toggle('ed-fkauf', auf);
      return;
    }
    if (b.classList.contains('ed-zu') && d.startViewTransition) {       /* gleiches Foto als Titelbild im Ratgeber: Bild wächst hinüber (site.css, vt-hero) */
      root.setAttribute('data-vt', '1'); var bb = s.querySelector('.ed-b'); if (bb) bb.style.viewTransitionName = 'vt-hero';
      setTimeout(function () { root.removeAttribute('data-vt'); if (bb) bb.style.viewTransitionName = ''; }, 1500);
    }
  });

  /* ---------- Bewegung anhalten ---------- */
  var rb = d.getElementById('ed-ruhe');
  function setRuhe(an, merk) {
    ruhe = an || RM; root.classList.toggle('ed-ruhe', ruhe);
    if (rb) { rb.setAttribute('aria-pressed', ruhe ? 'true' : 'false'); rb.setAttribute('aria-label', ruhe ? 'Bewegung wieder starten' : 'Bewegung anhalten'); }
    [].forEach.call(d.querySelectorAll('video.kf-film'), function (v) { if (v.__kf && v.__kf.pause) v.__kf.pause(ruhe); });
    if (!ruhe) los();
    if (merk) try { if (an) localStorage.setItem('sdruhe', '1'); else localStorage.removeItem('sdruhe'); } catch (e) {}
  }
  if (rb) rb.addEventListener('click', function () { setRuhe(!ruhe, true); });
  var ruheGemerkt = false; try { ruheGemerkt = localStorage.getItem('sdruhe') === '1'; } catch (e) {}
  if (ruheGemerkt) { if (d.readyState === 'complete') setRuhe(true); else addEventListener('load', function () { setRuhe(true); }); root.classList.add('ed-ruhe'); ruhe = true; if (rb) { rb.setAttribute('aria-pressed', 'true'); rb.setAttribute('aria-label', 'Bewegung wieder starten'); } }

  /* ---------- Alle Räume ---------- */
  var dlg = d.getElementById('ed-alle'), ag = d.getElementById('ed-ag'), af = d.getElementById('ed-af'), fw = d.getElementById('ed-fw'), leer = d.getElementById('ed-leer'), filt = '';
  var G = ag ? [].slice.call(ag.querySelectorAll('a[data-n]')) : [];
  G.forEach(function (a) { if (!by[a.dataset.n]) { a.remove(); } });           /* Saison-Räume außerhalb ihrer Zeit */
  G = G.filter(function (a) { return by[a.dataset.n]; });
  function welt() {
    if (!fw) return;
    var N = da();
    if (filt !== 'gm' || N.length < 2) { fw.hidden = true; return; }
    var Gr = [];
    N.forEach(function (n) { farben(by[n]).forEach(function (c) {
      var l = lab(c[1]), b = null, bd = 13;
      Gr.forEach(function (g) { var q = dE(g.l, l); if (q < bd) { bd = q; b = g; } });
      if (b) { var t = b.g + 1; b.l = [(b.l[0] * b.g + l[0]) / t, (b.l[1] * b.g + l[1]) / t, (b.l[2] * b.g + l[2]) / t]; b.g = t; b.m.push([c[0], l]); } else Gr.push({ l: l, g: 1, m: [[c[0], l]] });
    }); });
    var ch = function (g) { return Math.sqrt(g.l[1] * g.l[1] + g.l[2] * g.l[2]); }, out = [];
    Gr.sort(function (a, b) { return b.g - a.g || ch(b) - ch(a); });
    [16, 11, 0].forEach(function (mind) { Gr.forEach(function (g) { if (out.length < 5 && out.indexOf(g) < 0 && out.every(function (o) { return dE(o.l, g.l) >= mind; })) out.push(g); }); });
    out.sort(function (a, b) { return b.l[0] - a.l[0]; });
    var namen = [], P = out.map(function (g) {
      var m = g.m.slice().sort(function (a, b) { return dE(a[1], g.l) - dE(b[1], g.l); }), nm = '';
      for (var i = 0; i < m.length && !nm; i++) if (namen.indexOf(m[i][0]) < 0) nm = m[i][0];
      nm = nm || m[0][0]; namen.push(nm); return [nm, unlab(g.l)];
    });
    var ST = window.sdStile || {}, best = null;
    Object.keys(ST).forEach(function (k) {                                   /* gleiche Rechnung wie farbpalette.html */
      var sp = ST[k].pal.map(function (p) { return lab(p[1]); }), a = 0, b = 0, top = out.slice(0, 4);
      sp.forEach(function (x) { var m = 1e9; out.forEach(function (o) { m = Math.min(m, dE(x, o.l)); }); a += m; });
      top.forEach(function (o) { var m = 1e9; sp.forEach(function (x) { m = Math.min(m, dE(x, o.l)); }); b += m; });
      var sc = a / sp.length * .5 + b / top.length * .5; if (!best || sc < best.sc) best = { k: k, sc: sc };
    });
    var st = best && ST[best.k];
    fw.innerHTML = '<h3>Deine Farbwelt</h3><p>Die häufigsten Farben aus deinen ' + N.length + ' gemerkten Räumen. Antippen kopiert den Farbwert.</p><div class="ed-fks">' + P.map(feld).join('') + '</div>' +
      '<p class="ed-fws">' + (st ? 'Am nächsten liegt der Stil <b>' + st.name + '</b>. <a href="' + st.href + '">Zum Stil</a> · ' : '') + '<a href="' + studio(P) + '">Farben im Studio testen</a></p>';
    fw.hidden = false;
  }
  function filter(f) {
    filt = f || '';
    if (af) [].forEach.call(af.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', (b.dataset.f || '') === filt ? 'true' : 'false'); });
    var n = 0, cur = akt && akt.dataset.n;
    G.forEach(function (a) {
      var gm = M.indexOf(a.dataset.n) >= 0, ok = !filt || (filt === 'gm' ? gm : a.dataset.k === filt);
      a.hidden = !ok; a.classList.toggle('gm', gm); a.classList.toggle('da', a.dataset.n === cur);
      if (a.dataset.n === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (ok) n++;
    });
    if (leer) leer.hidden = !(filt === 'gm' && !n);
    welt();
  }
  function auf(f) {
    if (!dlg) return;
    filter(f === undefined ? filt : f);
    if (dlg.open) return;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    var c = ag && ag.querySelector('a.da:not([hidden])'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
  }
  function zuD() { if (dlg && dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }
  if (dlg) {
    var ab = d.getElementById('ed-auf'), zb = d.getElementById('ed-zu'), gb = d.getElementById('ed-gem'), nb = d.getElementById('ed-neu');
    if (ab) ab.addEventListener('click', function () { auf(); });
    if (zb) zb.addEventListener('click', zuD);
    if (gb) gb.addEventListener('click', function () { auf('gm'); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) { zuD(); return; }
      var c = e.target.closest('#ed-af button'); if (c) { filter(c.dataset.f || ''); return; }
      var a = e.target.closest('#ed-ag a[data-n]'); if (a && by[a.dataset.n]) { e.preventDefault(); zuD(); zu(by[a.dataset.n], true); }
    });
    if (nb) nb.addEventListener('click', function () {                       /* neu mischen: gleiche Räume, neue Reihenfolge */
      S = window.sdMisch ? window.sdMisch(S, (Date.now() % 2147483647) | 0) : S.sort(function () { return Math.random() - .5; });
      var f = d.createDocumentFragment(); S.forEach(function (s) { f.appendChild(s); }); ed.insertBefore(f, ende);
      zu(S[0], true); setAkt(S[0]);
    });
  }
  zaehl();
  function ausAdresse() { if (location.hash === '#gemerkt') auf('gm'); else if (location.hash === '#alle') auf(''); }
  ausAdresse(); addEventListener('hashchange', ausAdresse);

  /* ---------- Tastatur ---------- */
  d.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target, tag = t && t.tagName, ms = d.getElementById('msheet');
    if ((dlg && dlg.open) || (ms && !ms.hidden) || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    var k = e.key, knopf = tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY';
    if (k === 'ArrowDown' || k === 'PageDown' || k === 'j' || (k === ' ' && !e.shiftKey && !knopf)) { if (geh(1)) e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'PageUp' || k === 'k' || (k === ' ' && e.shiftKey && !knopf)) { if (geh(-1)) e.preventDefault(); }
    else if (k === 'Home') { e.preventDefault(); zu(S[0]); }
    else if (k === 'End') { e.preventDefault(); zu(ende); }
    else if ((k === 'm' || k === 'M') && akt && akt.dataset.n) merke(akt);
    else if (k === 'Escape' && akt) karteZu(akt);
  });

  /* ---------- Mausrad und Tastfeld ----------
     Mit Einrasten springt ein einzelner Rad-Schritt sonst wieder zurück. Darum zählt hier jede Bewegung als „ein Raum weiter“:
     Während der Fahrt und im Auslauf einer Wischbewegung (Werte werden kleiner) passiert nichts, erst eine neue Bewegung zählt wieder. */
  var wSperre = 0, wZuletzt = 0, wVor = 0, wSumme = 0, wOffen = false;
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || (dlg && dlg.open)) return;
    var ms = d.getElementById('msheet'); if (ms && !ms.hidden) return;
    var dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY, a = Math.abs(dy), t = e.timeStamp;
    if (!a || a < Math.abs(e.deltaX)) return;
    if (ft) { var f = ft.getBoundingClientRect(), H = body.clientHeight; if (f.top < H * .6 && f.height > H + 4 && (dy > 0 || f.top < -4)) return; }
    e.preventDefault();
    var neu = t - wZuletzt > 140 || a > wVor + 2 || a >= 80;
    wZuletzt = t; wVor = a;
    if (t < wSperre) return;
    if (!wOffen) { if (!neu) return; wOffen = true; wSumme = 0; }
    wSumme += dy;
    if (Math.abs(wSumme) >= 40) { geh(wSumme > 0 ? 1 : -1); wOffen = false; wSperre = t + (RM ? 250 : 620); }
  }, { passive: false });

  /* ---------- Start ---------- */
  if (!akt) setAkt(S[0]);
  setTimeout(function () { root.classList.remove('ed-ein'); }, 1400);
  if (!RM && stelle() === 0) {
    var hi = d.createElement('p'); hi.className = 'ed-hint'; hi.setAttribute('aria-hidden', 'true');
    hi.innerHTML = '<span class="t">Nach oben wischen</span><span class="m">Scrollen oder Pfeiltaste</span>' + AB;
    S[0].appendChild(hi); setTimeout(function () { hi.remove(); }, 6600);
  }
  window.sdWohnideen = { raeume: function () { return S.map(function (s) { return s.dataset.n; }); }, aktiv: function () { return akt && akt.dataset.n; }, gemerkt: function () { return M.slice(); }, zu: function (n) { zu(by[n], true); }, auf: auf };
})();
