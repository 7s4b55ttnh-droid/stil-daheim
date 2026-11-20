/* Stil-Daheim: Kaffee-Filme (seit 20.11.2026, Wunsch des Inhabers: realistisch, Kaffee schwappt, Dampf).
   Kurze stumme Filme in Schleife, mit KI erstellt (ElevenLabs: Standbild Seedream 5 Pro, Bewegung Kling 2.5 Turbo).
   Einbinden:
     <div class="kf-box">  (position:relative)
       <picture>…Standbild aus assets/ (bekommt automatisch die kleine Marke „KI“ von site.js)…</picture>
       <video class="kf-film" id="ID" muted loop playsinline preload="none" aria-hidden="true"
              data-film="assets/name" data-hoch="assets/name-hoch"></video>   (Dateien: name.mp4 und name.webm)
       <button class="kf-pause" data-kaffee-pause="ID" …>
   Der Film lädt erst, wenn er ins Bild kommt, läuft nur sichtbar und blendet über das Standbild.
   „Bewegung reduzieren“ und der Datensparmodus zeigen nur das Standbild. */
(function () {
  'use strict';
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
    SPAR = !!(navigator.connection && navigator.connection.saveData),
    HOCH = window.matchMedia ? matchMedia('(max-aspect-ratio: 4/5)') : { matches: false };
  var filme = [];

  function art(v) { return v.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : (v.canPlayType('video/webm; codecs="vp9"') ? '.webm' : '.mp4'); }
  function quelle(v) { var h = v.getAttribute('data-hoch'); return ((h && HOCH.matches) ? h : v.getAttribute('data-film')) + art(v); }

  function Film(v) {
    var F = this, btn = document.querySelector('[data-kaffee-pause="' + v.id + '"]'), pausiert = false, sichtbar = false, src = '';
    F.v = v;
    v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.playsInline = true;
    function laden() { var s = quelle(v); if (s !== src) { src = s; v.src = s; v.load(); } }
    function an() { if (pausiert || !sichtbar || document.hidden) return; laden(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function aus() { if (!v.paused) v.pause(); }
    F.pause = function (p) { pausiert = p; if (p) aus(); else an(); };
    F.laeuft = function () { return !v.paused && !v.ended && v.readyState > 2; };
    v.addEventListener('playing', function () { v.classList.add('an'); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { sichtbar = en.some(function (x) { return x.isIntersecting; }); if (sichtbar) an(); else aus(); }, { rootMargin: '200px' }).observe(v);
    else { sichtbar = true; an(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) aus(); else an(); });
    if (HOCH.addEventListener) HOCH.addEventListener('change', function () { if (src) { v.classList.remove('an'); src = ''; an(); } });
    if (btn) btn.addEventListener('click', function () {
      var p = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', p ? 'true' : 'false'); btn.setAttribute('aria-label', p ? 'Film abspielen' : 'Film anhalten'); F.pause(p);
    });
  }

  function init() {
    [].forEach.call(document.querySelectorAll('video.kf-film'), function (v) {
      if (v.__kf) return;
      if (RM || SPAR) { v.__kf = { laeuft: function () { return false; }, pause: function () {}, v: v }; var b = document.querySelector('[data-kaffee-pause="' + v.id + '"]'); if (b) b.hidden = true; return; }
      v.__kf = new Film(v); filme.push(v.__kf);
    });
  }
  window.sdKaffee = { init: init, filme: filme };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
