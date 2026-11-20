/* Stil-Daheim Kaffee-Szene (seit 20.11.2026, kaffee.html und Startseite).
   Nahaufnahme: Espresso läuft aus dem Siebträger in eine Tasse, die Crema dreht sich, Dampf steigt auf.
   Zweite Szene „matcha“: Ein Bambusbesen schlägt Matcha in einer Schale schaumig.
   Alles mit Canvas gezeichnet: kein Foto, kein KI-Bild, kein fremdes Skript.
   Einbinden: <canvas data-kaffee="espresso|matcha" data-lage="rechts|mitte" aria-label="…"></canvas> (data-spaet: Aufbau erst beim Hinscrollen)
   Pause-Knopf: <button data-kaffee-pause="ID-des-Canvas">. „Bewegung reduzieren“ zeigt ein Standbild.
   Läuft nur, solange die Szene sichtbar ist. window.sdKaffee.still(canvas, sekunde) zeichnet ein Standbild (für Vorschaubilder). */
(function () {
  'use strict';
  var TAU = Math.PI * 2,
    RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sm(a, b, x) { x = cl((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mixc(a, b, t, al) { var A = hx(a), B = hx(b); return 'rgba(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ',' + (al == null ? 1 : al) + ')'; }
  function RNG(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function sprite(rgb, soft) {
    var c = canvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(soft ? 0.05 : 0.62, 'rgba(' + rgb + ',' + (soft ? 0.9 : 0.85) + ')');
    g.addColorStop(soft ? 0.5 : 0.82, 'rgba(' + rgb + ',' + (soft ? 0.35 : 0.5) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
  }
  var SP = { steam: sprite('255,244,232', true), b1: sprite('255,186,104'), b2: sprite('255,214,150'), b3: sprite('236,140,70') };

  /* Farben je Szene */
  var P = {
    espresso: { glaze: ['#b9a690', '#e8ddcd', '#fffaf2', '#f2e9dd', '#d8c9b5', '#a6937d', '#76644f'], inner: ['#8c7864', '#d9ccbb', '#f3eadf'], rim: '#8a6a4b', clay: ['#8d6c52', '#5c4333'], loop: 15.5 },
    matcha: { glaze: ['#1f1712', '#3a2c22', '#6f5745', '#4a3a2e', '#2e231c', '#1d1612', '#120d0a'], inner: ['#1b1410', '#3d2f25', '#5a4636'], rim: '#cdb79b', clay: ['#9a7a5c', '#6b5240'], loop: 13 }
  };

  function Szene(cv, mode, lage) {
    var S = this, ctx = cv.getContext('2d'), F = P[mode], W, H, D, G = {}, L0, L1, L2, L3, tex, low, lc, stC, stx, t = 0, swirl = 0, last = 0,
      run = false, vis = false, pausiert = false, raf = 0, parts = [], rip = [], drops = [], spawnS = 0, rnd = RNG(11), nextDrop = 0, foam = 0;
    S.cv = cv;

    function prof(tt) { return mode === 'matcha' ? G.R * (1 - 0.40 * Math.pow(tt, 1.45)) : G.R * (1 - 0.30 * Math.pow(tt, 2.2)); }
    function yAt(tt) { return G.rimY + tt * G.Hc; }

    /* ---------- Aufbau: Maße und feste Ebenen ---------- */
    function layout() {
      var r = cv.getBoundingClientRect();
      W = Math.max(220, r.width || cv.clientWidth || 600); H = Math.max(160, r.height || cv.clientHeight || 400);
      D = Math.min(window.devicePixelRatio || 1, 2); if (W * H * D * D > 3.2e6) D = Math.sqrt(3.2e6 / (W * H));
      cv.width = Math.round(W * D); cv.height = Math.round(H * D);
      var asp = W / H;
      if (mode === 'matcha') { G.R = Math.min(W * 0.33, H * 0.40); G.cx = W * 0.5; G.rimY = H * 0.46; G.e = 0.38; G.Hc = G.R * 0.64; }
      else {
        if (lage !== 'mitte' && asp > 1.15) { G.R = Math.min(H * 0.185, W * 0.12); G.cx = W * 0.70; G.rimY = H * 0.62; }
        else if (asp < 0.85) { G.R = Math.min(W * 0.23, H * 0.125); G.cx = W * 0.5; G.rimY = H * 0.33; }
        else { G.R = Math.min(H * 0.20, W * 0.19); G.cx = W * 0.5; G.rimY = H * 0.57; }
        G.e = 0.44; G.Hc = G.R * 1.0;
      }
      G.wall = G.R * 0.06; G.Ri = G.R - G.wall; G.tIn = 0.88;
      G.baseT = 0.97; G.y97 = yAt(G.baseT); G.footH = G.Hc * (mode === 'matcha' ? 0.10 : 0.07);
      G.fr0 = prof(G.baseT) * 0.86; G.fr1 = prof(G.baseT) * (mode === 'matcha' ? 0.80 : 0.78); G.gY = G.y97 + G.footH;
      G.yP = G.rimY - G.R * 1.55; G.sx = [G.cx - G.R * 0.16, G.cx + G.R * 0.16]; G.g = G.R * 16;
      L0 = canvas(cv.width, cv.height); L1 = canvas(cv.width, cv.height); L2 = canvas(cv.width, cv.height); L3 = canvas(cv.width, cv.height);
      low = canvas(Math.ceil(W / 3), Math.ceil(H / 3)); lc = low.getContext('2d');
      stC = canvas(Math.ceil(W / 4), Math.ceil(H / 4)); stx = stC.getContext('2d');
      drawL0(); drawL1(); drawL2(); drawL3(); if (!tex) tex = mode === 'matcha' ? texMatcha() : texCrema();
      bokehInit();
    }
    function c2(L) { var c = L.getContext('2d'); c.setTransform(D, 0, 0, D, 0, 0); return c; }

    /* Hintergrund: warmer dunkler Raum, Lichtschein, Abtropfgitter bzw. Holztisch */
    function drawL0() {
      var c = c2(L0), g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b130e'); g.addColorStop(0.6, '#140e0a'); g.addColorStop(1, '#0d0907'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      g = c.createRadialGradient(G.cx - G.R * 1.4, G.rimY - G.R * 1.2, 0, G.cx - G.R * 1.4, G.rimY - G.R * 1.2, G.R * 4.2);
      g.addColorStop(0, 'rgba(255,168,88,.20)'); g.addColorStop(0.45, 'rgba(210,120,60,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      g = c.createRadialGradient(G.cx, G.rimY, 0, G.cx, G.rimY, G.R * 2.6);
      g.addColorStop(0, 'rgba(120,70,36,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      var top = G.gY - G.R * (mode === 'matcha' ? 0.55 : 0.42);
      if (mode === 'matcha') {
        g = c.createLinearGradient(0, top, 0, H); g.addColorStop(0, '#3b2618'); g.addColorStop(0.35, '#2c1c12'); g.addColorStop(1, '#170f0a');
        c.fillStyle = g; c.fillRect(0, top, W, H - top);
        var r = RNG(5); c.lineWidth = 1;
        for (var i = 0; i < 46; i++) {
          var yy = top + Math.pow(r(), 1.4) * (H - top), a = 0.04 + r() * 0.06; c.strokeStyle = 'rgba(' + (r() < .5 ? '255,200,150' : '20,10,5') + ',' + a + ')';
          c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(W * 0.3, yy + (r() - .5) * 8, W * 0.7, yy + (r() - .5) * 8, W, yy + (r() - .5) * 6); c.stroke();
        }
        g = c.createLinearGradient(0, top - 2, 0, top + 6); g.addColorStop(0, 'rgba(255,190,130,0)'); g.addColorStop(0.5, 'rgba(255,190,130,.22)'); g.addColorStop(1, 'rgba(255,190,130,0)');
        c.fillStyle = g; c.fillRect(0, top - 2, W, 8);
      } else {
        g = c.createLinearGradient(0, top, 0, H); g.addColorStop(0, '#1f1915'); g.addColorStop(1, '#0c0907'); c.fillStyle = g; c.fillRect(0, top, W, H - top);
        var n = 16;
        for (var k = 1; k < n; k++) {
          var y = top + (H - top) * Math.pow(k / n, 1.55), th = 1 + (k / n) * G.R * 0.05;
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, y, W, th);
          c.fillStyle = 'rgba(255,200,150,' + (0.05 + 0.06 * (1 - k / n)) + ')'; c.fillRect(0, y - 1, W, 1);
        }
        g = c.createLinearGradient(0, top - 3, 0, top + 4); g.addColorStop(0, 'rgba(255,200,140,0)'); g.addColorStop(0.5, 'rgba(255,200,140,.28)'); g.addColorStop(1, 'rgba(255,200,140,0)');
        c.fillStyle = g; c.fillRect(0, top - 3, W, 7);
      }
      /* weicher Schatten und warmer Widerschein unter der Tasse */
      c.save(); c.translate(G.cx, G.gY); c.scale(1, G.e);
      g = c.createRadialGradient(0, 0, 0, 0, 0, G.fr1 * 1.9); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(0.55, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, G.fr1 * 1.9, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(G.cx, G.gY + G.Hc * 0.3); c.scale(1, 0.55);
      g = c.createRadialGradient(0, 0, 0, 0, 0, G.R * 0.9); g.addColorStop(0, 'rgba(255,225,190,.07)'); g.addColorStop(1, 'rgba(255,225,190,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, G.R * 0.9, 0, TAU); c.fill(); c.restore();
    }

    function chrome(c, x0, x1, warm) {
      var g = c.createLinearGradient(x0, 0, x1, 0), s = [[0, '#1d1a18'], [0.1, '#6e6862'], [0.19, '#ece6dc'], [0.26, '#5b554f'], [0.44, '#262220'], [0.6, '#968e84'], [0.69, '#f4eee5'], [0.77, '#6a635c'], [1, '#1a1716']];
      s.forEach(function (p) { g.addColorStop(p[0], p[1]); }); return g;
    }
    function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }

    /* Maschine (nur Espresso), Innenwand und hinterer Tassenrand */
    function drawL1() {
      var c = c2(L1), R = G.R, cx = G.cx, g;
      if (mode !== 'matcha') {
        var yG = G.yP - R * 0.98, yB = G.yP - R * 0.3;
        g = c.createLinearGradient(cx - R * 2.2, 0, cx + R * 2.2, 0); g.addColorStop(0, 'rgba(14,11,9,0)'); g.addColorStop(0.18, '#120e0c'); g.addColorStop(0.5, '#1d1714'); g.addColorStop(0.82, '#110d0b'); g.addColorStop(1, 'rgba(14,11,9,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(cx - R * 2.2, -2); c.lineTo(cx + R * 2.2, -2); c.lineTo(cx + R * 2.2, yG - R * 0.05);
        c.quadraticCurveTo(cx, yG + R * 0.02, cx - R * 2.2, yG - R * 0.05); c.closePath(); c.fill();
        g = c.createLinearGradient(cx - R * 1.9, 0, cx + R * 1.9, 0); g.addColorStop(0, 'rgba(255,190,130,0)'); g.addColorStop(0.35, 'rgba(255,190,130,.22)'); g.addColorStop(1, 'rgba(255,190,130,0)');
        c.strokeStyle = g; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - R * 2.2, yG - R * 0.06); c.quadraticCurveTo(cx, yG + R * 0.01, cx + R * 2.2, yG - R * 0.06); c.stroke();
        /* Brühgruppe */
        c.fillStyle = chrome(c, cx - R * 0.8, cx + R * 0.8); c.beginPath(); c.moveTo(cx - R * 0.8, yG - R * 0.05); c.lineTo(cx + R * 0.8, yG - R * 0.05);
        c.lineTo(cx + R * 0.76, yG + R * 0.3); c.ellipse(cx, yG + R * 0.3, R * 0.76, R * 0.1, 0, 0, Math.PI); c.closePath(); c.fill();
        /* Siebträger */
        c.fillStyle = chrome(c, cx - R * 0.66, cx + R * 0.66); c.beginPath(); c.moveTo(cx - R * 0.66, yG + R * 0.34); c.lineTo(cx + R * 0.66, yG + R * 0.34);
        c.lineTo(cx + R * 0.56, yB - R * 0.08); c.ellipse(cx, yB - R * 0.08, R * 0.56, R * 0.14, 0, 0, Math.PI); c.closePath(); c.fill();
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(cx - R * 0.66, yG + R * 0.34, R * 1.32, R * 0.03);
        /* Ausläufe */
        c.fillStyle = chrome(c, cx - R * 0.3, cx + R * 0.3); c.beginPath(); c.moveTo(cx - R * 0.3, yB); c.lineTo(cx + R * 0.3, yB); c.lineTo(cx + R * 0.22, G.yP - R * 0.13); c.lineTo(cx - R * 0.22, G.yP - R * 0.13); c.closePath(); c.fill();
        G.sx.forEach(function (x) {
          c.fillStyle = chrome(c, x - R * 0.045, x + R * 0.045); c.beginPath(); c.moveTo(x - R * 0.04, G.yP - R * 0.14); c.lineTo(x + R * 0.04, G.yP - R * 0.14); c.lineTo(x + R * 0.048, G.yP); c.lineTo(x - R * 0.048, G.yP); c.closePath(); c.fill();
          c.fillStyle = '#120c08'; ell(c, x, G.yP, R * 0.034, R * 0.012); c.fill();
        });
        /* warmer Lichtschein von links auf dem Chrom */
        c.globalCompositeOperation = 'source-atop';
        g = c.createLinearGradient(cx - R * 0.8, 0, cx + R * 0.2, 0); g.addColorStop(0, 'rgba(255,150,70,.22)'); g.addColorStop(1, 'rgba(255,150,70,0)');
        c.fillStyle = g; c.fillRect(cx - R * 0.8, yG - R * 0.05, R, G.yP - yG + R * 0.05);
        c.globalCompositeOperation = 'source-over';
      }
      /* Innenwand */
      c.save(); ell(c, cx, G.rimY, G.Ri, G.Ri * G.e); c.clip();
      g = c.createLinearGradient(cx - G.Ri, 0, cx + G.Ri, 0); g.addColorStop(0, F.inner[0]); g.addColorStop(0.55, F.inner[1]); g.addColorStop(1, F.inner[2]);
      c.fillStyle = g; c.fillRect(cx - R, G.rimY - R, 2 * R, 2 * R);
      g = c.createLinearGradient(0, G.rimY - G.Ri * G.e, 0, G.rimY + G.Ri * G.e); g.addColorStop(0, 'rgba(255,240,220,.10)'); g.addColorStop(0.5, 'rgba(25,14,8,.18)'); g.addColorStop(1, 'rgba(25,14,8,.55)');
      c.fillStyle = g; c.fillRect(cx - R, G.rimY - R, 2 * R, 2 * R); c.restore();
      ring(c, true);
    }
    /* Tassenrand als Ring, hinten (oben) oder vorn (unten) */
    function ring(c, hinten) {
      var cx = G.cx, R = G.R; c.save(); c.beginPath(); c.rect(0, hinten ? 0 : G.rimY, W, hinten ? G.rimY : H); c.clip();
      c.beginPath(); c.ellipse(cx, G.rimY, R, R * G.e, 0, 0, TAU); c.ellipse(cx, G.rimY, G.Ri, G.Ri * G.e, 0, 0, TAU);
      var g = c.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, mode === 'matcha' ? '#a8916f' : '#e9dece'); g.addColorStop(0.3, mode === 'matcha' ? '#e2cfb2' : '#fffaf3'); g.addColorStop(1, mode === 'matcha' ? '#8a7457' : '#cdbda8');
      c.fillStyle = g; c.fill('evenodd');
      c.lineWidth = Math.max(1, R * 0.012); c.strokeStyle = mode === 'matcha' ? 'rgba(90,60,35,.6)' : 'rgba(138,106,75,.55)'; ell(c, cx, G.rimY, R, R * G.e); c.stroke(); c.restore();
    }

    function bodyPath(c) {
      var cx = G.cx, n = 28, i, tt;
      c.beginPath(); c.moveTo(cx - G.R, G.rimY);
      for (i = 1; i <= n; i++) { tt = G.baseT * i / n; c.lineTo(cx - prof(tt), yAt(tt)); }
      var rb = prof(G.baseT); c.ellipse(cx, G.y97, rb, rb * G.e, 0, Math.PI, 0, true);
      for (i = n; i >= 0; i--) { tt = G.baseT * i / n; c.lineTo(cx + prof(tt), yAt(tt)); }
      c.ellipse(cx, G.rimY, G.R, G.R * G.e, 0, 0, Math.PI, false); c.closePath();
    }

    /* Tasse von außen: Fuß, Körper mit Glasur, Sprenkeln und Glanz, vorderer Rand, Henkel */
    function drawL2() {
      var c = c2(L2), cx = G.cx, R = G.R, g, i;
      /* Fuß aus unglasiertem Ton */
      c.beginPath(); c.moveTo(cx - G.fr0, G.y97); c.lineTo(cx - G.fr1, G.gY); c.ellipse(cx, G.gY, G.fr1, G.fr1 * G.e, 0, Math.PI, 0, true); c.lineTo(cx + G.fr0, G.y97); c.closePath();
      g = c.createLinearGradient(cx - G.fr0, 0, cx + G.fr0, 0); g.addColorStop(0, F.clay[1]); g.addColorStop(0.3, F.clay[0]); g.addColorStop(1, '#2e2018'); c.fillStyle = g; c.fill();
      /* Henkel (nur Espresso) */
      if (mode !== 'matcha') {
        var a = [cx + prof(0.16) - R * 0.03, yAt(0.16)], b = [cx + prof(0.66) - R * 0.03, yAt(0.66)];
        var path = function () { c.beginPath(); c.moveTo(a[0], a[1]); c.bezierCurveTo(cx + R * 1.5, yAt(0.06), cx + R * 1.48, yAt(0.78), b[0], b[1]); };
        path(); c.lineCap = 'round'; c.lineWidth = R * 0.15; c.strokeStyle = '#8d7a66'; c.stroke();
        path(); c.lineWidth = R * 0.11; g = c.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, '#fbf5ec'); g.addColorStop(0.5, '#e4d7c5'); g.addColorStop(1, '#b4a28c'); c.strokeStyle = g; c.stroke();
        path(); c.lineWidth = R * 0.035; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke();
      }
      /* Körper */
      bodyPath(c); g = c.createLinearGradient(cx - R, 0, cx + R, 0);
      [0, 0.08, 0.25, 0.42, 0.64, 0.84, 1].forEach(function (p, k) { g.addColorStop(p, F.glaze[k]); }); c.fillStyle = g; c.fill();
      c.save(); bodyPath(c); c.clip();
      g = c.createLinearGradient(0, G.rimY, 0, G.y97 + R * G.e); g.addColorStop(0, 'rgba(255,240,220,.10)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(25,14,8,.42)');
      c.fillStyle = g; c.fillRect(cx - R * 1.1, G.rimY - R, R * 2.2, G.Hc + R * 2);
      /* Glanzstreifen und Lichtkante */
      var hx0 = cx - R * 0.5, hy = G.rimY + G.Hc * 0.42; g = c.createRadialGradient(hx0, hy, 0, hx0, hy, G.Hc * 0.55);
      g.addColorStop(0, mode === 'matcha' ? 'rgba(255,225,190,.30)' : 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.save(); c.translate(hx0, hy); c.scale(0.16, 1); c.translate(-hx0, -hy); c.fillStyle = g; c.fillRect(hx0 - G.Hc, hy - G.Hc, G.Hc * 2, G.Hc * 2); c.restore();
      g = c.createLinearGradient(cx - R, 0, cx - R * 0.8, 0); g.addColorStop(0, 'rgba(255,170,90,.45)'); g.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = g; c.fillRect(cx - R, G.rimY, R * 0.2, G.Hc);
      /* Sprenkel (Steinzeug) bzw. Glasurlauf (Matcha-Schale) */
      var r = RNG(mode === 'matcha' ? 19 : 3);
      if (mode === 'matcha') {
        for (i = 0; i < 9; i++) {
          var x = cx - R + r() * 2 * R, len = G.Hc * (0.15 + r() * 0.35), w = R * (0.05 + r() * 0.08);
          g = c.createLinearGradient(0, G.rimY, 0, G.rimY + len); g.addColorStop(0, 'rgba(205,183,155,.55)'); g.addColorStop(1, 'rgba(205,183,155,0)');
          c.fillStyle = g; c.beginPath(); c.ellipse(x, G.rimY + len * 0.45, w, len * 0.55, 0, 0, TAU); c.fill();
        }
      } else {
        for (i = 0; i < 170; i++) { c.fillStyle = 'rgba(' + (r() < 0.7 ? '95,66,44' : '60,42,30') + ',' + (0.18 + r() * 0.35) + ')'; ell(c, cx - R + r() * 2 * R, G.rimY + r() * G.Hc, R * (0.004 + r() * 0.008), R * (0.004 + r() * 0.007)); c.fill(); }
      }
      c.restore();
      ring(c, false);
    }
    function drawL3() {
      var c = c2(L3), g = c.createRadialGradient(G.cx, G.rimY, Math.min(W, H) * 0.25, G.cx, G.rimY, Math.max(W, H) * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    }

    /* Crema: feine Tigerung, an den Rändern dunkler, kleine Bläschen am Rand */
    function texCrema() {
      var c = canvas(512, 512), x = c.getContext('2d'), r = RNG(23), i;
      for (i = 0; i < 1500; i++) {
        var rr = Math.sqrt(r()) * 250, th = r() * TAU, px = 256 + Math.cos(th) * rr, py = 256 + Math.sin(th) * rr, dark = r() < 0.5 + rr / 900;
        x.save(); x.translate(px, py); x.rotate(th + Math.PI / 2 + (r() - 0.5) * 0.6);
        x.fillStyle = dark ? 'rgba(70,32,12,' + (0.15 + r() * 0.35) + ')' : 'rgba(236,182,112,' + (0.12 + r() * 0.3) + ')';
        x.beginPath(); x.ellipse(0, 0, 3 + r() * 13, 1 + r() * 2.4, 0, 0, TAU); x.fill(); x.restore();
      }
      for (i = 0; i < 260; i++) { var q = 180 + r() * 72, a = r() * TAU; x.fillStyle = 'rgba(250,218,170,' + (0.25 + r() * 0.4) + ')'; x.beginPath(); x.arc(256 + Math.cos(a) * q, 256 + Math.sin(a) * q, 0.6 + r() * 2, 0, TAU); x.fill(); }
      return c;
    }
    function texMatcha() {
      var c = canvas(512, 512), x = c.getContext('2d'), r = RNG(31), i;
      for (i = 0; i < 3200; i++) { var rr = Math.sqrt(r()) * 252, a = r() * TAU; x.fillStyle = r() < 0.75 ? 'rgba(232,245,200,' + (0.10 + r() * 0.28) + ')' : 'rgba(60,92,26,' + (0.12 + r() * 0.25) + ')'; x.beginPath(); x.arc(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr, 0.5 + r() * 1.8, 0, TAU); x.fill(); }
      for (i = 0; i < 70; i++) { var q = Math.sqrt(r()) * 140, b = r() * TAU, s = 1.5 + r() * 4; x.strokeStyle = 'rgba(240,250,215,.45)'; x.lineWidth = 0.8; x.beginPath(); x.arc(256 + Math.cos(b) * q, 256 + Math.sin(b) * q, s, 0, TAU); x.stroke(); }
      return c;
    }

    /* ---------- Bewegliche Teile ---------- */
    var bok = [];
    function bokehInit() {
      var r = RNG(41), i, sp = [SP.b1, SP.b2, SP.b3]; bok = [];
      for (i = 0; i < 14; i++) {
        var x = r() * W, y = r() * H * 0.75;
        if (Math.abs(x - G.cx) < G.R * 1.3 && y > G.yP - G.R) x = (x + W * 0.45) % W;
        bok.push({ x: x, y: y, s: G.R * (0.16 + r() * 0.42), a: 0.05 + r() * 0.13, sp: sp[i % 3], ph: r() * TAU, f: 0.12 + r() * 0.2 });
      }
    }
    function drawBokeh(tt) {
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, low.width, low.height); lc.setTransform(1 / 3, 0, 0, 1 / 3, 0, 0);
      bok.forEach(function (b) {
        var x = b.x + Math.sin(tt * b.f + b.ph) * G.R * 0.12, y = b.y + Math.cos(tt * b.f * 0.8 + b.ph) * G.R * 0.07;
        lc.globalAlpha = b.a * (0.75 + 0.25 * Math.sin(tt * 0.5 + b.ph)); lc.drawImage(b.sp, x - b.s, y - b.s, b.s * 2, b.s * 2);
      });
      lc.globalAlpha = 1; ctx.drawImage(low, 0, 0, cv.width, cv.height);
    }

    function zustand(tt) {
      var s = {};
      if (mode === 'matcha') {
        s.lev = 0.72; s.crema = sm(0.6, 5.2, tt); s.omega = 0.05 + 0.5 * sm(5.0, 6.2, tt) * (1 - sm(6.2, 9, tt)); s.steam = 0.6 + 0.4 * sm(1, 5, tt);
        s.whisk = tt > 0.4 && tt < 6.8; s.wx = Math.sin(tt * 15) * (1 - sm(4.9, 5.6, tt)) * 0.42 + Math.cos(tt * 5) * 0.12 * sm(4.9, 5.6, tt);
        s.wy = Math.pow(sm(5.6, 6.8, tt), 1.6) * 3; s.wa = 1 - sm(6.2, 6.8, tt);
      } else {
        var tS = 1.3, tE = 9.6;
        s.lev = 0.76 * (1 - Math.pow(1 - cl((tt - 1.85) / 8.35, 0, 1), 1.8)); s.crema = sm(2.0, 4.6, tt); s.tint = sm(2.2, 9.5, tt); s.blond = sm(6.6, 9.6, tt);
        s.omega = tt < tE ? 1.1 * sm(1.9, 2.6, tt) : 1.1 * Math.exp(-(tt - tE) * 0.55) + 0.05; s.steam = sm(3, 7.5, tt);
        s.on = tt > tS && tt < tE + 1.2; s.head = G.yP + 0.5 * G.g * Math.pow(Math.max(0, tt - tS), 2);
        s.tail = tt > tE ? G.yP + 0.5 * G.g * Math.pow(tt - tE, 2) : G.yP; s.thin = 1 - 0.62 * sm(8.5, tE, tt);
      }
      s.fade = Math.max(1 - sm(0, 0.6, tt), sm(F.loop - 0.9, F.loop - 0.1, tt));
      return s;
    }
    function surface(lev) { var ts = G.tIn * (1 - lev), y = yAt(ts), rs = Math.max(G.R * 0.2, prof(ts) - G.wall * 1.05); return { y: y, r: rs }; }

    function drawLiquid(s, tt) {
      var su = surface(s.lev), cx = G.cx, e = G.e, g;
      ctx.save(); ell(ctx, cx, G.rimY, G.Ri, G.Ri * e); ctx.clip();
      if (mode === 'matcha') {
        g = ctx.createRadialGradient(cx - su.r * 0.1, su.y - su.r * e * 0.25, su.r * 0.05, cx, su.y, su.r);
        g.addColorStop(0, mixc('#4d7426', '#a9c96e', s.crema)); g.addColorStop(0.7, mixc('#3e621d', '#8db556', s.crema)); g.addColorStop(1, mixc('#2a4513', '#5f8a33', s.crema));
      } else {
        g = ctx.createRadialGradient(cx - su.r * 0.12, su.y - su.r * e * 0.2, su.r * 0.04, cx, su.y, su.r);
        g.addColorStop(0, mixc('#3a1c0c', '#c88e52', s.tint * s.crema)); g.addColorStop(0.6, mixc('#2a140a', '#a2652f', s.tint * s.crema)); g.addColorStop(1, mixc('#1c0d06', '#5a2f15', s.tint * s.crema));
      }
      ctx.fillStyle = g; ell(ctx, cx, su.y, su.r, su.r * e); ctx.fill();
      ctx.save(); ell(ctx, cx, su.y, su.r, su.r * e); ctx.clip(); ctx.translate(cx, su.y); ctx.scale(1, e); ctx.rotate(swirl);
      ctx.globalAlpha = mode === 'matcha' ? 0.25 + 0.75 * s.crema : 0.15 + 0.7 * s.crema; ctx.drawImage(tex, -su.r, -su.r, su.r * 2, su.r * 2); ctx.restore();
      if (mode === 'matcha' && s.whisk && s.wa > 0.2) {
        /* Zickzack-Spuren vom Besen */
        ctx.save(); ell(ctx, cx, su.y, su.r, su.r * e); ctx.clip(); ctx.strokeStyle = 'rgba(225,240,190,' + (0.10 * (1 - s.wy) * (1 - s.crema * 0.6)) + ')'; ctx.lineWidth = G.R * 0.008;
        for (var k = 0; k < 4; k++) { var yy = su.y + (k - 1.5) * su.r * e * 0.34; ctx.beginPath(); for (var j = 0; j <= 16; j++) { var xx = cx - su.r * 0.7 + su.r * 1.4 * j / 16; ctx.lineTo(xx, yy + Math.sin(j * 1.9 + tt * 30 + k) * su.r * e * 0.05); } ctx.stroke(); }
        ctx.restore();
      }
      /* Rand dunkler, Meniskus, Glanzlicht */
      g = ctx.createRadialGradient(cx, su.y, su.r * 0.55, cx, su.y, su.r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, mode === 'matcha' ? 'rgba(20,35,8,.45)' : 'rgba(25,10,4,.55)');
      ctx.save(); ctx.translate(cx, su.y); ctx.scale(1, e); ctx.translate(-cx, -su.y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, su.y, su.r, 0, TAU); ctx.fill(); ctx.restore();
      ctx.lineWidth = Math.max(1, G.R * 0.01); ctx.strokeStyle = 'rgba(255,225,185,.22)'; ctx.beginPath(); ctx.ellipse(cx, su.y, su.r, su.r * e, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      g = ctx.createRadialGradient(cx - su.r * 0.38, su.y - su.r * e * 0.42, 0, cx - su.r * 0.38, su.y - su.r * e * 0.42, su.r * 0.42);
      g.addColorStop(0, 'rgba(255,236,205,.16)'); g.addColorStop(1, 'rgba(255,236,205,0)');
      ctx.save(); ctx.translate(cx - su.r * 0.38, su.y - su.r * e * 0.42); ctx.scale(1, 0.45); ctx.translate(-(cx - su.r * 0.38), -(su.y - su.r * e * 0.42));
      ctx.fillStyle = g; ctx.fillRect(cx - su.r, su.y - su.r, su.r * 1.4, su.r * 1.4); ctx.restore();
      /* Wellenringe und heller Aufprall der Strahlen */
      ctx.save(); ell(ctx, cx, su.y, su.r, su.r * e); ctx.clip();
      rip = rip.filter(function (q) { return tt - q.b < 1.1 && tt >= q.b; });
      rip.forEach(function (q) { var a = (tt - q.b) / 1.1, rr = G.R * (0.03 + a * 0.5); ctx.strokeStyle = 'rgba(255,220,170,' + (0.32 * (1 - a)) + ')'; ctx.lineWidth = Math.max(0.8, G.R * 0.009); ell(ctx, q.x, su.y + q.dy, rr, rr * e); ctx.stroke(); });
      if (mode !== 'matcha' && s.on && s.head > su.y - 2) {
        G.sx.forEach(function (x, i) {
          var fl = 0.8 + 0.2 * Math.sin(tt * 23 + i * 2), rr = G.R * 0.11 * fl * s.thin;
          g = ctx.createRadialGradient(x, su.y, 0, x, su.y, rr); g.addColorStop(0, 'rgba(232,170,100,.75)'); g.addColorStop(1, 'rgba(232,170,100,0)');
          ctx.fillStyle = g; ell(ctx, x, su.y, rr, rr * e); ctx.fill();
        });
      }
      ctx.restore(); ctx.restore();
      return su;
    }

    function strahl(x0, y0, y1, w0, w1, tt, i, blond) {
      if (y1 - y0 < 1) return;
      var n = Math.max(8, Math.ceil((y1 - y0) / 5)), Lp = [], Rp = [], k, y, w, x, f;
      for (k = 0; k <= n; k++) {
        y = y0 + (y1 - y0) * k / n; f = cl((y - G.yP) / (G.R * 1.6), 0, 1);
        w = lerp(w0, w1, Math.sqrt(f)); x = x0 + Math.sin(y * 0.06 / (G.R / 100) + tt * 9 + i * 1.7) * G.R * 0.0045 * f + (i ? -1 : 1) * G.R * 0.012 * f * f;
        Lp.push([x - w / 2, y]); Rp.push([x + w / 2, y]);
      }
      ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]); for (k = 1; k <= n; k++) ctx.lineTo(Lp[k][0], Lp[k][1]); for (k = n; k >= 0; k--) ctx.lineTo(Rp[k][0], Rp[k][1]); ctx.closePath();
      var g = ctx.createLinearGradient(0, y0, 0, y1), band = G.R * 0.12, m = 18;
      for (k = 0; k <= m; k++) { y = y0 + (y1 - y0) * k / m; var s = 0.5 + 0.5 * Math.sin((y - tt * G.R * 2.6 + i * 13) / band * TAU); g.addColorStop(k / m, mixc(blond > 0.5 ? '#6b3a18' : '#3a1b0b', '#d08d48', cl(s * 0.75 + blond * 0.35, 0, 1))); }
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); for (k = 0; k <= n; k += 2) ctx.lineTo(Lp[k][0] + (Rp[k][0] - Lp[k][0]) * 0.28, Lp[k][1]);
      ctx.strokeStyle = 'rgba(255,224,175,.5)'; ctx.lineWidth = Math.max(0.6, w1 * 0.22); ctx.stroke();
    }

    function drawStreams(s, su, tt, dt) {
      var R = G.R;
      if (s.on) {
        var bot = Math.min(s.head, su.y), top = Math.max(G.yP, s.tail);
        G.sx.forEach(function (x, i) { if (bot > top) strahl(x, top, bot, R * 0.056 * s.thin, R * 0.036 * s.thin, tt, i, s.blond); });
        if (s.head >= su.y && s.tail < su.y) { spawnS += dt; while (spawnS > 0.13) { spawnS -= 0.13; G.sx.forEach(function (x) { rip.push({ x: x + G.R * 0.012, dy: 0, b: tt }); }); } }
      }
      /* Tropfen vor dem Strahl und danach */
      var dropTimes = [0.55, 0.95, 10.4, 11.1, 12.0];
      dropTimes.forEach(function (d, k) { if (tt >= d && last < d) drops.push({ x: G.sx[k % 2], y: G.yP, v: 0, b: tt }); });
      drops = drops.filter(function (d) {
        d.v += G.g * dt; d.y += d.v * dt;
        if (d.y >= su.y) { rip.push({ x: d.x, dy: 0, b: tt }); return false; }
        ctx.fillStyle = '#4a240e'; ell(ctx, d.x, d.y, R * 0.017, R * 0.026); ctx.fill();
        ctx.fillStyle = 'rgba(255,215,160,.55)'; ell(ctx, d.x - R * 0.006, d.y - R * 0.008, R * 0.005, R * 0.008); ctx.fill(); return true;
      });
      /* hängender Tropfen am Auslauf */
      if (!s.on || tt > 10) G.sx.forEach(function (x, i) { var a = 0.5 + 0.5 * Math.sin(tt * 2 + i); ctx.fillStyle = 'rgba(70,34,14,' + (0.7 * a) + ')'; ell(ctx, x, G.yP + R * 0.012, R * 0.022, R * 0.016 * (0.8 + a * 0.5)); ctx.fill(); });
    }

    function drawWhisk(s, su, tt) {
      if (!s.whisk || s.wa <= 0) return;
      var R = G.R, x = G.cx + s.wx * su.r, lift = s.wy * R * 1.1, base = su.y - lift, tilt = Math.cos(tt * 15) * 0.07 * (1 - s.wy);
      ctx.save(); ctx.globalAlpha = s.wa; ctx.translate(x, base); ctx.rotate(tilt);
      /* Zinken, nur über der Oberfläche sichtbar */
      var nz = 30, top = -R * 0.42, spread = R * 0.2;
      ctx.lineWidth = Math.max(0.7, R * 0.006);
      for (var k = 0; k < nz; k++) {
        var f = k / (nz - 1) - 0.5, bx = f * spread * 2, front = Math.abs(f) < 0.5;
        ctx.strokeStyle = 'rgba(' + (k % 3 ? '226,200,146' : '196,166,110') + ',' + (0.85) + ')';
        ctx.beginPath(); ctx.moveTo(f * R * 0.06, top); ctx.quadraticCurveTo(bx * 0.9, -R * 0.18, bx, 0); ctx.stroke();
      }
      /* Griff aus Bambus */
      var g = ctx.createLinearGradient(-R * 0.07, 0, R * 0.07, 0); g.addColorStop(0, '#8a6b3c'); g.addColorStop(0.35, '#e6cb8e'); g.addColorStop(0.7, '#c19c5c'); g.addColorStop(1, '#7a5c32');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-R * 0.05, top); ctx.lineTo(-R * 0.068, top - R * 0.08); ctx.lineTo(-R * 0.068, top - R * 0.95); ctx.quadraticCurveTo(0, top - R * 1.02, R * 0.068, top - R * 0.95); ctx.lineTo(R * 0.068, top - R * 0.08); ctx.lineTo(R * 0.05, top); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(90,64,30,.6)'; ctx.fillRect(-R * 0.068, top - R * 0.55, R * 0.136, R * 0.025);
      ctx.restore();
      /* Schaum um die Zinken */
      if (s.wy < 0.3) { ctx.save(); ell(ctx, G.cx, G.rimY, G.Ri, G.Ri * G.e); ctx.clip(); var gw = ctx.createRadialGradient(x, su.y, 0, x, su.y, R * 0.2); gw.addColorStop(0, 'rgba(222,238,180,.28)'); gw.addColorStop(1, 'rgba(222,238,180,0)'); ctx.fillStyle = gw; ell(ctx, x, su.y, R * 0.2, R * 0.2 * G.e); ctx.fill(); ctx.restore(); }
    }

    /* Dampf: viele weiche Flecken, klein gezeichnet und vergrößert, dadurch ganz weich */
    function drawSteam(s, su, tt, dt) {
      var R = G.R, rate = (mode === 'matcha' ? 16 : 20) * s.steam;
      if (dt > 0) {
        spawnSteam(rate * dt, su, tt);
        parts = parts.filter(function (p) {
          p.age += dt; if (p.age > p.life) return false;
          p.y -= p.vy * dt; p.x += (Math.sin(p.age * 1.1 + p.ph) * 0.7 + Math.sin(p.y / (R * 0.45) + tt * 0.5) * 0.5) * R * (0.06 + 0.1 * p.age / p.life) * dt + p.vx * dt; return true;
        });
      }
      stx.setTransform(1, 0, 0, 1, 0, 0); stx.clearRect(0, 0, stC.width, stC.height); stx.setTransform(1 / 4, 0, 0, 1 / 4, 0, 0);
      parts.forEach(function (p) {
        var a = p.age / p.life, sz = p.s0 + (p.s1 - p.s0) * a;
        stx.globalAlpha = p.al * Math.sin(Math.PI * a) * (1 - s.fade); stx.drawImage(SP.steam, p.x - sz * 0.75, p.y - sz * 1.2, sz * 1.5, sz * 2.4);
      });
      stx.globalAlpha = 1; ctx.drawImage(stC, 0, 0, cv.width, cv.height);
    }
    function spawnSteam(n, su, tt) {
      foam += n;
      while (foam >= 1) {
        foam -= 1; var R = G.R;
        parts.push({ x: G.cx + (rnd() - 0.5) * su.r * 1.25, y: su.y - su.r * G.e * (rnd() * 0.6), vy: R * (0.26 + rnd() * 0.26), vx: (rnd() - 0.5) * R * 0.04, age: 0, life: 3.2 + rnd() * 2.6,
          s0: R * (0.06 + rnd() * 0.04), s1: R * (0.26 + rnd() * 0.26), al: 0.04 + rnd() * 0.045, ph: rnd() * TAU });
      }
    }

    /* ---------- Ein Bild zeichnen ---------- */
    function frame(tt, dt) {
      var s = zustand(tt);
      swirl += s.omega * dt;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(L0, 0, 0); drawBokeh(tt); ctx.drawImage(L1, 0, 0);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      var su = drawLiquid(s, tt);
      if (mode === 'matcha') drawWhisk(s, su, tt); else drawStreams(s, su, tt, dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(L2, 0, 0);
      ctx.setTransform(D, 0, 0, D, 0, 0); drawSteam(s, su, tt, dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(L3, 0, 0);
      if (s.fade > 0.001) { ctx.fillStyle = 'rgba(10,7,5,' + s.fade + ')'; ctx.fillRect(0, 0, cv.width, cv.height); }
      last = tt;
    }
    function reset() { parts = []; rip = []; drops = []; swirl = 0; last = 0; spawnS = 0; foam = 0; }
    /* Standbild: Dampf und Strudel vorher still durchrechnen */
    S.still = function (ts) {
      layout(); reset(); var tt = Math.max(0, ts - 6), dt = 1 / 30;
      while (tt < ts) { var s = zustand(tt), su = surface(s.lev); swirl += s.omega * dt; spawnSteam((mode === 'matcha' ? 16 : 20) * s.steam * dt, su, tt);
        parts = parts.filter(function (p) { p.age += dt; if (p.age > p.life) return false; p.y -= p.vy * dt; p.x += (Math.sin(p.age * 1.1 + p.ph) * 0.7 + Math.sin(p.y / (G.R * 0.45) + tt * 0.5) * 0.5) * G.R * (0.06 + 0.1 * p.age / p.life) * dt + p.vx * dt; return true; });
        rip = rip.filter(function (q) { return tt - q.b < 1.1; }); last = tt; tt += dt; }
      t = ts; last = ts; frame(ts, 0);
    };
    function tick(now) {
      if (!run) return;
      var dt = last0 ? Math.min(0.05, (now - last0) / 1000) : 0; last0 = now; t += dt;
      if (t >= F.loop) { t -= F.loop; reset(); }
      frame(t, dt); raf = requestAnimationFrame(tick);
    }
    var last0 = 0;
    function an() { if (run || pausiert || RM || !vis) return; run = true; last0 = 0; raf = requestAnimationFrame(tick); }
    function aus() { run = false; cancelAnimationFrame(raf); }
    S.pause = function (p) { pausiert = p; if (p) aus(); else an(); };
    S.laeuft = function () { return run; };
    S.zeit = function () { return t; };

    layout();
    var first = mode === 'matcha' ? 0.6 : 1.0;
    if (RM) S.still(mode === 'matcha' ? 8.5 : 12.4); else { t = first; reset(); last = t; frame(t, 0); }
    cv.classList.add('kf-an');
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en.some(function (x) { return x.isIntersecting; }); if (vis) an(); else aus(); }, { rootMargin: '80px' }).observe(cv);
    else { vis = true; an(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) aus(); else an(); });
    var rt = 0; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var tt = t; layout(); if (RM || !run) { if (RM) S.still(mode === 'matcha' ? 8.5 : 12.4); else frame(tt, 0); } }, 160); });
  }

  function init(root) {
    [].forEach.call((root || document).querySelectorAll('canvas[data-kaffee]'), function (cv) {
      if (cv.__kf || cv.__kfw) return;
      var mach = function () { if (!cv.__kf) cv.__kf = new Szene(cv, cv.getAttribute('data-kaffee') === 'matcha' ? 'matcha' : 'espresso', cv.getAttribute('data-lage') || 'auto'); };
      /* data-spaet: erst aufbauen, wenn der Canvas in die Nähe kommt (Startseite) */
      if (cv.hasAttribute('data-spaet') && 'IntersectionObserver' in window) {
        cv.__kfw = 1; var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); mach(); } }, { rootMargin: '600px' }); io.observe(cv);
      } else mach();
    });
    [].forEach.call((root || document).querySelectorAll('[data-kaffee-pause]'), function (b) {
      if (b.__kf) return; b.__kf = 1; var cv = document.getElementById(b.getAttribute('data-kaffee-pause'));
      if (RM) { b.hidden = true; return; }
      b.addEventListener('click', function () { if (!cv || !cv.__kf) return; var p = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', p ? 'true' : 'false'); b.setAttribute('aria-label', p ? 'Animation abspielen' : 'Animation anhalten'); cv.__kf.pause(p); });
    });
  }
  window.sdKaffee = { init: init, still: function (cv, ts) { if (cv.__kf) cv.__kf.still(ts); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); }); else init();
})();
