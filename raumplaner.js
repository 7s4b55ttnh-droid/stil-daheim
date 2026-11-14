/* Stil-Daheim Raumplaner. Lesbarer Quelltext mit Kommentaren: Branch quellen, raumplaner.js */
(function (G) {
'use strict';
var RULE = {
walk: 70,
hall: 90,
table: [40, 50],
tableLen: [1 / 2, 2 / 3],
rug: [30, 50],
rugUnder: 20,
rugs: [[160, 230], [200, 300], [240, 340], [300, 400]],
chair: [60, 80],
rugBed: [50, 60],
tv: 1.5,
bed: 80,
wardrobe: 80,
seat: 60,
sofaWall: [5, 10],
radiator: 20,
bulb: 800,
lumen: { wohnen: [100, 150], schlafen: [100, 100], arbeiten: [300, 500], flur: [100, 150] },
rod: [15, 20],
pend: [60, 80]
};
var TVS = [32, 40, 43, 50, 55, 65, 75, 85];
var CAT = {
sofa3: { n: 'Sofa 3-Sitzer', N: 'Sofa', a: 'n', s: 'Sofa', w: 220, h: 95, k: 'sofa', g: 0, acc: 'f', sz: [[190, 90], [220, 95], [250, 100]] },
sofa2: { n: 'Sofa 2-Sitzer', N: 'Sofa', a: 'n', s: 'Sofa', w: 160, h: 90, k: 'sofa', g: 0, acc: 'f', sz: [[140, 85], [160, 90], [180, 90]] },
eck: { n: 'Ecksofa', N: 'Ecksofa', a: 'n', s: 'Ecksofa', w: 260, h: 180, k: 'eck', g: 0, acc: 'f', sz: [[230, 160], [260, 180], [290, 200]] },
sessel: { n: 'Sessel', N: 'Sessel', a: 'm', s: 'Sessel', w: 80, h: 85, k: 'sessel', g: 0, acc: 'f' },
hocker: { n: 'Hocker', N: 'Hocker', a: 'm', s: '', w: 55, h: 55, k: 'hocker', g: 0, small: 1 },
couch: { n: 'Couchtisch', N: 'Couchtisch', a: 'm', s: 'Tisch', w: 110, h: 60, k: 'tisch', g: 1, sz: [[90, 50], [110, 60], [130, 70]] },
couchr: { n: 'Couchtisch rund', N: 'Couchtisch', a: 'm', s: 'Tisch', w: 80, h: 80, k: 'rund', g: 1, round: 1, sz: [[60, 60], [80, 80], [100, 100]] },
ess: { n: 'Esstisch', N: 'Esstisch', a: 'm', s: 'Esstisch', w: 160, h: 90, k: 'ess', g: 1, acc: 'a', sz: [[120, 80], [160, 90], [200, 100], [240, 100]] },
essr: { n: 'Esstisch rund', N: 'Esstisch', a: 'm', s: 'Esstisch', w: 110, h: 110, k: 'essr', g: 1, acc: 'a', round: 1, sz: [[90, 90], [110, 110], [130, 130]] },
schreib: { n: 'Schreibtisch', N: 'Schreibtisch', a: 'm', s: 'Schreibtisch', w: 140, h: 70, k: 'schreib', g: 1, acc: 'f', sz: [[100, 60], [120, 60], [140, 70], [160, 80]] },
tv: { n: 'TV-Board', N: 'TV-Board', a: 'n', s: 'TV', w: 160, h: 40, k: 'tv', g: 2, acc: 'f', sz: [[120, 40], [160, 40], [200, 45]] },
side: { n: 'Sideboard', N: 'Sideboard', a: 'n', s: 'Sideboard', w: 160, h: 45, k: 'kasten', g: 2, acc: 'f' },
regal: { n: 'Regal', N: 'Regal', a: 'n', s: 'Regal', w: 80, h: 35, k: 'regal', g: 2, acc: 'f', tall: 1 },
kommode: { n: 'Kommode', N: 'Kommode', a: 'f', s: 'Kommode', w: 100, h: 45, k: 'kasten', g: 2, acc: 'f' },
schrank: { n: 'Kleiderschrank', N: 'Kleiderschrank', a: 'm', s: 'Schrank', w: 200, h: 60, k: 'schrank', g: 2, acc: 'f', tall: 1, sz: [[100, 60], [150, 60], [200, 60], [250, 60], [300, 60]] },
bett180: { n: 'Doppelbett', N: 'Bett', a: 'n', s: 'Bett', w: 180, h: 200, k: 'bett', g: 3, acc: 'b', sz: [[160, 200], [180, 200], [200, 200]] },
bett140: { n: 'Bett 140', N: 'Bett', a: 'n', s: 'Bett', w: 140, h: 200, k: 'bett', g: 3, acc: 'b', sz: [[120, 200], [140, 200]] },
bett90: { n: 'Einzelbett', N: 'Bett', a: 'n', s: 'Bett', w: 90, h: 200, k: 'bett', g: 3, acc: 'b', sz: [[90, 200], [100, 200]] },
nacht: { n: 'Nachttisch', N: 'Nachttisch', a: 'm', s: '', w: 45, h: 40, k: 'kasten', g: 3, small: 1 },
garderobe: { n: 'Garderobe', N: 'Garderobe', a: 'f', s: 'Garderobe', w: 100, h: 35, k: 'kasten', g: 4, acc: 'f', tall: 1 },
schuh: { n: 'Schuhkipper', N: 'Schuhkipper', a: 'm', s: 'Schuhe', w: 80, h: 18, k: 'kasten', g: 4, acc: 'f' },
bank: { n: 'Sitzbank', N: 'Sitzbank', a: 'f', s: 'Bank', w: 100, h: 35, k: 'tisch', g: 4 },
teppich: { n: 'Teppich', N: 'Teppich', a: 'm', s: '', w: 300, h: 200, k: 'teppich', g: 5, flat: 1, sz: [[230, 160], [300, 200], [340, 240], [400, 300]] },
teppichr: { n: 'Teppich rund', N: 'Teppich', a: 'm', s: '', w: 160, h: 160, k: 'teppichr', g: 5, flat: 1, round: 1, sz: [[160, 160], [200, 200], [240, 240]] },
laeufer: { n: 'Läufer', N: 'Läufer', a: 'm', s: '', w: 200, h: 80, k: 'teppich', g: 5, flat: 1 },
pflanze: { n: 'Pflanze', N: 'Pflanze', a: 'f', s: '', w: 45, h: 45, k: 'pflanze', g: 5, small: 1, round: 1 },
lampe: { n: 'Stehleuchte', N: 'Stehleuchte', a: 'f', s: '', w: 35, h: 35, k: 'lampe', g: 5, small: 1, round: 1 },
eigen: { n: 'Eigenes Möbel', N: 'Möbel', a: 'n', s: 'Möbel', w: 100, h: 50, k: 'tisch', g: 5, acc: 'f' },
sperr: { n: 'Sperrfläche', N: 'Sperrfläche', a: 'f', s: 'gesperrt', w: 100, h: 100, k: 'block', g: 5 }
};
var GROUPS = ['Sitzen', 'Tische', 'Stauraum', 'Schlafen', 'Flur', 'Mehr'];
var TYPES = { wohnen: 'Wohnzimmer', schlafen: 'Schlafzimmer', essen: 'Esszimmer', arbeiten: 'Arbeitszimmer', flur: 'Flur', leer: 'Leerer Raum' };
var LIM = { room: [100, 1500], item: [15, 600], door: [60, 240], win: [40, 500], doors: 4, wins: 6, items: 40 };
var S = null, uid = 1;
var OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
var FR = ['S', 'W', 'N', 'E'], BK = ['N', 'E', 'S', 'W'], LF = ['W', 'N', 'E', 'S'], RT = ['E', 'S', 'W', 'N'];
var VEC = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
var WALLNAME = { N: 'obere Wand', S: 'untere Wand', W: 'linke Wand', E: 'rechte Wand' };
function def() {
return { w: 420, d: 360, type: 'wohnen', doors: [{ wall: 'S', pos: 30, size: 90, hinge: 0, inw: 1 }], wins: [{ wall: 'N', pos: 140, size: 140 }], items: [] };
}
var START = '420x360.wohnen~dS.30.90.0.1~fN.140.140~msofa3.320.70.220.95.1~mtv.0.100.160.40.3~mcouch.215.120.120.60.1~mteppich.140.30.300.200.1~mregal.6.0.80.35.0~mlampe.370.29.35.35.1~mpflanze.367.307.45.45.0';
function use(st) { S = st; uid = 1; S.items.forEach(function (i) { if (!(i.id > 0)) i.id = uid++; else if (i.id >= uid) uid = i.id + 1; }); return S; }
function state() { return S; }
function newId() { return uid++; }
function lim(v, a, b) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : NaN; }
function bw(i) { return i.r % 2 ? i.h : i.w; }
function bh(i) { return i.r % 2 ? i.w : i.h; }
function box(i) { return { x: i.x, y: i.y, w: bw(i), h: bh(i) }; }
function ctr(i) { return { x: i.x + bw(i) / 2, y: i.y + bh(i) / 2 }; }
function abs(i, lx, ly) {
switch (i.r) {
case 0: return [i.x + lx, i.y + ly];
case 1: return [i.x + i.h - ly, i.y + lx];
case 2: return [i.x + i.w - lx, i.y + i.h - ly];
default: return [i.x + ly, i.y + i.w - lx];
}
}
function lrect(i, x, y, w, h) { var a = abs(i, x, y), b = abs(i, x + w, y + h); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) }; }
function legOf(i) { return Math.min(110, Math.round(Math.min(i.w, i.h) * 0.53)); }
function rects(i) {
if (CAT[i.t].k !== 'eck') return [box(i)];
var l = legOf(i);
return [lrect(i, 0, 0, i.w, l), lrect(i, i.flip ? 0 : i.w - l, l, l, i.h - l)];
}
function circ(i) { return { cx: i.x + bw(i) / 2, cy: i.y + bh(i) / 2, r: Math.min(bw(i), bh(i)) / 2 }; }
function isRound(i) { return !!CAT[i.t].round && Math.abs(i.w - i.h) < 1; }
function hit(A, B) { return A.x < B.x + B.w - 1 && B.x < A.x + A.w - 1 && A.y < B.y + B.h - 1 && B.y < A.y + A.h - 1; }
function hitCR(c, R) { var px = Math.min(R.x + R.w, Math.max(R.x, c.cx)), py = Math.min(R.y + R.h, Math.max(R.y, c.cy)); return Math.hypot(px - c.cx, py - c.cy) < c.r - 1; }
function overlap(a, b) {
var ra = isRound(a), rb = isRound(b), i, j, A, B;
if (ra && rb) { A = circ(a); B = circ(b); return Math.hypot(A.cx - B.cx, A.cy - B.cy) < A.r + B.r - 1; }
if (ra || rb) { A = circ(ra ? a : b); B = rects(ra ? b : a); for (i = 0; i < B.length; i++) if (hitCR(A, B[i])) return true; return false; }
A = rects(a); B = rects(b);
for (i = 0; i < A.length; i++) for (j = 0; j < B.length; j++) if (hit(A[i], B[j])) return true;
return false;
}
function link(A, B) {
var ax = A.x + A.w, ay = A.y + A.h, bx = B.x + B.w, by = B.y + B.h, x1, x2, y1, y2;
if (ax <= B.x) { x1 = ax; x2 = B.x; } else if (bx <= A.x) { x1 = A.x; x2 = bx; } else { x1 = x2 = (Math.max(A.x, B.x) + Math.min(ax, bx)) / 2; }
if (ay <= B.y) { y1 = ay; y2 = B.y; } else if (by <= A.y) { y1 = A.y; y2 = by; } else { y1 = y2 = (Math.max(A.y, B.y) + Math.min(ay, by)) / 2; }
return { d: Math.hypot(x2 - x1, y2 - y1), x1: x1, y1: y1, x2: x2, y2: y2 };
}
function linkItems(a, b) {
var best = null, A = rects(a), B, i, j, L;
if (isRound(b)) {
var c = circ(b);
for (i = 0; i < A.length; i++) {
var px = Math.min(A[i].x + A[i].w, Math.max(A[i].x, c.cx)), py = Math.min(A[i].y + A[i].h, Math.max(A[i].y, c.cy)), dd = Math.hypot(px - c.cx, py - c.cy);
L = { d: Math.max(0, dd - c.r), x1: px, y1: py, x2: dd > 0 ? c.cx + (px - c.cx) / dd * c.r : c.cx, y2: dd > 0 ? c.cy + (py - c.cy) / dd * c.r : c.cy };
if (!best || L.d < best.d) best = L;
}
return best;
}
B = rects(b);
for (i = 0; i < A.length; i++) for (j = 0; j < B.length; j++) { L = link(A[i], B[j]); if (!best || L.d < best.d) best = L; }
return best;
}
function wallLen(w) { return w === 'N' || w === 'S' ? S.w : S.d; }
function wallPt(w, t) { return w === 'N' ? [t, 0] : w === 'S' ? [t, S.d] : w === 'W' ? [0, t] : [S.w, t]; }
function hasDoor(w) { return S.doors.some(function (o) { return o.wall === w; }); }
function hasWin(w) { return S.wins.some(function (o) { return o.wall === w; }); }
function swing(o) {
var s = o.size, p = o.pos, b = o.wall === 'N' ? { x: p, y: 0 } : o.wall === 'S' ? { x: p, y: S.d - s } : o.wall === 'W' ? { x: 0, y: p } : { x: S.w - s, y: p };
b.w = s; b.h = s; var q = wallPt(o.wall, o.hinge ? p + s : p); b.hx = q[0]; b.hy = q[1]; return b;
}
function inSwing(o, R) {
if (!o.inw) return false;
var b = swing(o), x1 = Math.max(R.x, b.x), y1 = Math.max(R.y, b.y), x2 = Math.min(R.x + R.w, b.x + b.w), y2 = Math.min(R.y + R.h, b.y + b.h);
if (x2 - x1 < 1 || y2 - y1 < 1) return false;
var cx = Math.min(x2, Math.max(x1, b.hx)), cy = Math.min(y2, Math.max(y1, b.hy));
return Math.hypot(cx - b.hx, cy - b.hy) < o.size - 1;
}
function blocksDoor(i) { if (CAT[i.t].flat) return false; var R = rects(i); return S.doors.some(function (o) { return R.some(function (q) { return inSwing(o, q); }); }); }
function front(o, depth) {
return o.wall === 'N' ? { x: o.pos, y: 0, w: o.size, h: depth } : o.wall === 'S' ? { x: o.pos, y: S.d - depth, w: o.size, h: depth } : o.wall === 'W' ? { x: 0, y: o.pos, w: depth, h: o.size } : { x: S.w - depth, y: o.pos, w: depth, h: o.size };
}
function inside(i) { return i.x >= -0.5 && i.y >= -0.5 && i.x + bw(i) <= S.w + 0.5 && i.y + bh(i) <= S.d + 0.5; }
function fit(i) { i.x = Math.round(Math.max(0, Math.min(S.w - bw(i), i.x))); i.y = Math.round(Math.max(0, Math.min(S.d - bh(i), i.y))); return i; }
function valid(i) {
if (!inside(i)) return false;
if (CAT[i.t].flat) return true;
for (var k = 0; k < S.items.length; k++) { var o = S.items[k]; if (o !== i && !CAT[o.t].flat && overlap(i, o)) return false; }
return !blocksDoor(i);
}
function gap(R, dir, skip) {
var best = dir === 'N' ? R.y : dir === 'S' ? S.d - R.y - R.h : dir === 'W' ? R.x : S.w - R.x - R.w, who = null;
S.items.forEach(function (o) {
if (CAT[o.t].flat || (skip && skip(o))) return;
rects(o).forEach(function (Q) {
var dd;
if (dir === 'N' || dir === 'S') { if (Q.x >= R.x + R.w - 1 || Q.x + Q.w <= R.x + 1) return; dd = dir === 'N' ? R.y - (Q.y + Q.h) : Q.y - (R.y + R.h); }
else { if (Q.y >= R.y + R.h - 1 || Q.y + Q.h <= R.y + 1) return; dd = dir === 'W' ? R.x - (Q.x + Q.w) : Q.x - (R.x + R.w); }
if (dd > -2 && dd < best) { best = dd; who = o; }
});
});
return { d: Math.max(0, Math.round(best)), who: who, dir: dir };
}
function gapLine(R, g) {
var v = VEC[g.dir], x = g.dir === 'W' ? R.x : g.dir === 'E' ? R.x + R.w : R.x + R.w / 2, y = g.dir === 'N' ? R.y : g.dir === 'S' ? R.y + R.h : R.y + R.h / 2;
return { x1: x, y1: y, x2: x + v[0] * g.d, y2: y + v[1] * g.d, l: g.d };
}
function noun(i) { return CAT[i.t].N; }
function Nom(i) { return { m: 'Der ', n: 'Das ', f: 'Die ' }[CAT[i.t].a] + noun(i); }
function nom(i) { return { m: 'der ', n: 'das ', f: 'die ' }[CAT[i.t].a] + noun(i); }
function dat(i) { return (CAT[i.t].a === 'f' ? 'der ' : 'dem ') + noun(i); }
function zu(i) { return (CAT[i.t].a === 'f' ? 'zur ' : 'zum ') + noun(i); }
function fz(n, dg) { return n.toLocaleString('de-DE', { minimumFractionDigits: dg || 0, maximumFractionDigits: dg || 0 }); }
function cm(n) { return fz(Math.round(n)) + ' cm'; }
function met(n) { return fz(n / 100, 1) + ' m'; }
function r5(n) { return Math.round(n / 5) * 5; }
function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1]; }
function chairs(t) {
var b = box(t), me = function (o) { return o === t; }, out = { b: 0, f: 0, l: 0, r: 0, n: 0, min: 1e9, minDir: null, gaps: {} };
if (CAT[t.t].k === 'essr') {
out.n = Math.max(2, Math.floor(Math.PI * t.w / RULE.seat));
['N', 'E', 'S', 'W'].forEach(function (dr) { var g = gap(b, dr, me); out.gaps[dr] = g; if (g.d < out.min) { out.min = g.d; out.minDir = dr; } });
return out;
}
var per = Math.max(1, Math.floor(t.w / RULE.seat)), end = t.h >= 80 ? 1 : 0;
[['b', BK, per], ['f', FR, per], ['l', LF, end], ['r', RT, end]].forEach(function (s) {
var dr = s[1][t.r], g = gap(b, dr, me); out.gaps[dr] = g;
if (g.d >= 40 && s[2]) { out[s[0]] = s[2]; out.n += s[2]; if (g.d < out.min) { out.min = g.d; out.minDir = dr; } }
});
return out;
}
function solids(i) {
var c = CAT[i.t], out = rects(i), b;
if (c.k === 'ess') {
var ch = chairs(i); b = box(i);
[['b', BK], ['f', FR], ['l', LF], ['r', RT]].forEach(function (s) {
if (!ch[s[0]]) return; var dr = s[1][i.r], e = 25;
out.push(dr === 'N' ? { x: b.x, y: b.y - e, w: b.w, h: e } : dr === 'S' ? { x: b.x, y: b.y + b.h, w: b.w, h: e } : dr === 'W' ? { x: b.x - e, y: b.y, w: e, h: b.h } : { x: b.x + b.w, y: b.y, w: e, h: b.h });
});
} else if (c.k === 'essr') { b = box(i); out = [{ x: b.x - 22, y: b.y - 22, w: b.w + 44, h: b.h + 44, round: 1 }]; }
else if (c.k === 'schreib') out.push(lrect(i, i.w / 2 - 25, i.h, 50, 40));
else if (isRound(i)) { b = box(i); out = [{ x: b.x, y: b.y, w: b.w, h: b.h, round: 1 }]; }
return out;
}
var COARSE = false;
function walk() {
if (!S.doors.length) return null;
var c = (S.w * S.d <= 60e4 ? 2.5 : S.w * S.d <= 150e4 ? 5 : 7.5) * (COARSE ? 2 : 1), nx = Math.ceil(S.w / c), ny = Math.ceil(S.d / c), N = nx * ny, INF = 1e20, f = new Float32Array(N), i, x, y;
for (i = 0; i < N; i++) f[i] = INF;
S.items.forEach(function (it) {
if (CAT[it.t].flat) return;
solids(it).forEach(function (R) {
var x0 = Math.max(0, Math.ceil(R.x / c - 0.5)), x1 = Math.min(nx - 1, Math.floor((R.x + R.w) / c - 0.5)), y0 = Math.max(0, Math.ceil(R.y / c - 0.5)), y1 = Math.min(ny - 1, Math.floor((R.y + R.h) / c - 0.5)), xx, yy;
if (R.round) {
var cx = R.x + R.w / 2, cy = R.y + R.h / 2, rr = R.w / 2;
for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) if (Math.hypot((xx + 0.5) * c - cx, (yy + 0.5) * c - cy) <= rr) f[yy * nx + xx] = 0;
} else for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) f[yy * nx + xx] = 0;
});
});
var n = Math.max(nx, ny), v = new Int32Array(n), z = new Float32Array(n + 1), g = new Float32Array(n), dd = new Float32Array(n), q, k, s, p;
function pass(len) {
k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
for (q = 1; q < len; q++) {
do { p = v[k]; s = ((g[q] + q * q) - (g[p] + p * p)) / (2 * q - 2 * p); } while (s <= z[k] && --k >= 0);
k++; v[k] = q; z[k] = s; z[k + 1] = INF;
}
k = 0;
for (q = 0; q < len; q++) { while (z[k + 1] < q) k++; p = v[k]; dd[q] = (q - p) * (q - p) + g[p]; }
}
for (x = 0; x < nx; x++) { for (y = 0; y < ny; y++) g[y] = f[y * nx + x]; pass(ny); for (y = 0; y < ny; y++) f[y * nx + x] = dd[y]; }
for (y = 0; y < ny; y++) { for (x = 0; x < nx; x++) g[x] = f[y * nx + x]; pass(nx); for (x = 0; x < nx; x++) f[y * nx + x] = dd[x]; }
var cq = new Uint8Array(N);
for (y = 0; y < ny; y++) for (x = 0; x < nx; x++) {
i = y * nx + x; if (f[i] === 0) continue;
var px = (x + 0.5) * c, py = (y + 0.5) * c, r = Math.min(Math.sqrt(f[i]) * c, px, S.w - px, py, S.d - py);
cq[i] = Math.max(1, Math.min(255, Math.round(r)));
}
var best = new Uint8Array(N), pred = new Int32Array(N), B = [], L;
for (i = 0; i < N; i++) pred[i] = -1;
for (i = 0; i < 256; i++) B.push([]);
var d0 = S.doors[0], mid = wallPt(d0.wall, d0.pos + d0.size / 2), R0 = d0.size / 2 + 25;
var sx0 = Math.max(0, Math.floor((mid[0] - R0) / c)), sx1 = Math.min(nx - 1, Math.ceil((mid[0] + R0) / c)), sy0 = Math.max(0, Math.floor((mid[1] - R0) / c)), sy1 = Math.min(ny - 1, Math.ceil((mid[1] + R0) / c));
for (y = sy0; y <= sy1; y++) for (x = sx0; x <= sx1; x++) {
i = y * nx + x;
if (cq[i] && Math.hypot((x + 0.5) * c - mid[0], (y + 0.5) * c - mid[1]) <= R0) { best[i] = cq[i]; B[cq[i]].push(i); }
}
for (L = 255; L > 0; L--) {
var Q = B[L];
while (Q.length) {
var ci = Q.pop(); if (best[ci] !== L) continue;
var ix = ci % nx, iy = (ci - ix) / nx;
for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
if (!dx && !dy) continue;
var X = ix + dx, Y = iy + dy; if (X < 0 || Y < 0 || X >= nx || Y >= ny) continue;
var ni = Y * nx + X, cv = cq[ni]; if (!cv) continue;
var val = cv < L ? cv : L;
if (val > best[ni]) { best[ni] = val; pred[ni] = ci; B[val].push(ni); }
}
}
}
function zoneMax(R) {
var x0 = Math.max(0, Math.floor(R.x / c)), x1 = Math.min(nx - 1, Math.ceil((R.x + R.w) / c) - 1), y0 = Math.max(0, Math.floor(R.y / c)), y1 = Math.min(ny - 1, Math.ceil((R.y + R.h) / c) - 1), m = 0, at = -1, xx, yy;
for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) { var b = best[yy * nx + xx]; if (b > m) { m = b; at = yy * nx + xx; } }
return { v: m, at: at };
}
function pinch(at) {
var m = 999, where = at, guard = 0;
while (at >= 0 && guard++ < N) { if (cq[at] < m) { m = cq[at]; where = at; } at = pred[at]; }
var wx = where % nx, wy = (where - wx) / nx;
return { x: (wx + 0.5) * c, y: (wy + 0.5) * c, r: m };
}
var out = { list: [], min: 999, worst: null, need: S.type === 'flur' ? RULE.hall : RULE.walk };
function target(R, o) {
var zm = zoneMax(R), e = { v: zm.v * 2, at: zm.at };
for (var key in o) e[key] = o[key];
if (zm.at >= 0) e.pinch = pinch(zm.at);
out.list.push(e);
if (e.v < out.min) { out.min = e.v; out.worst = e; }
}
S.items.forEach(function (it) {
var a = CAT[it.t].acc; if (!a) return;
var b = box(it), Z = 80, e = { N: 0, E: 0, S: 0, W: 0 };
if (a === 'a') e.N = e.E = e.S = e.W = Z;
else if (a === 'b') { e[FR[it.r]] = Z; e[LF[it.r]] = Z; e[RT[it.r]] = Z; }
else { e[FR[it.r]] = Z; e[LF[it.r]] = 40; e[RT[it.r]] = 40; }
target({ x: b.x - e.W, y: b.y - e.N, w: b.w + e.W + e.E, h: b.h + e.N + e.S }, { it: it });
});
S.doors.forEach(function (o, k) { if (k) target(front(o, Math.max(80, o.size)), { door: k }); });
if (!out.list.length) { var all = zoneMax({ x: 0, y: 0, w: S.w, h: S.d }); out.min = all.v * 2; }
return out;
}
function wallFree(wl, depth, noWin) {
var len = wallLen(wl), bl = [];
function strip(R) {
var a, b, near;
if (wl === 'N') { near = R.y < depth; a = R.x; b = R.x + R.w; } else if (wl === 'S') { near = R.y + R.h > S.d - depth; a = R.x; b = R.x + R.w; }
else if (wl === 'W') { near = R.x < depth; a = R.y; b = R.y + R.h; } else { near = R.x + R.w > S.w - depth; a = R.y; b = R.y + R.h; }
if (near) bl.push([a - 2, b + 2]);
}
S.doors.forEach(function (o) { if (o.wall === wl) bl.push([o.pos - 6, o.pos + o.size + 6]); if (o.inw) strip(swing(o)); });
if (noWin) S.wins.forEach(function (o) { if (o.wall === wl) bl.push([o.pos - 4, o.pos + o.size + 4]); });
S.items.forEach(function (i) { if (!CAT[i.t].flat) rects(i).forEach(strip); });
bl.sort(function (a, b) { return a[0] - b[0]; });
var out = [], p = 0;
bl.forEach(function (b) { if (b[0] > p) out.push([p, Math.min(b[0], len)]); p = Math.max(p, b[1]); });
if (p < len) out.push([p, len]);
return out.filter(function (v) { return v[1] - v[0] >= 20; });
}
function atWall(t, wl, pos, w, h, g) {
var i = { id: uid++, t: t, w: w, h: h, r: { N: 0, E: 1, S: 2, W: 3 }[wl], x: 0, y: 0 };
if (wl === 'N') { i.x = pos; i.y = g; } else if (wl === 'S') { i.x = pos; i.y = S.d - h - g; } else if (wl === 'W') { i.x = g; i.y = pos; } else { i.x = S.w - h - g; i.y = pos; }
i.x = Math.round(i.x); i.y = Math.round(i.y); return i;
}
function putWall(t, wl, o) {
o = o || {};
var c = CAT[t], w = o.w || c.w, h = o.h || c.h, g = o.gap || 0, pad = o.pad || 0, best = null;
wallFree(wl, h + g + (o.clear || 0), o.noWin != null ? o.noWin : !!c.tall).forEach(function (v) {
if (v[1] - v[0] < w + 2 * pad) return;
var lo = v[0] + w / 2 + pad, hi = v[1] - w / 2 - pad, pref = o.center != null ? o.center : o.end === 'a' ? lo : o.end === 'b' ? hi : (v[0] + v[1]) / 2;
var cc = Math.min(hi, Math.max(lo, pref)), cost = o.center != null ? Math.abs(cc - pref) : -(v[1] - v[0]);
if (!best || cost < best.cost) best = { c: cc, cost: cost };
});
if (!best) return null;
var i = atWall(t, wl, best.c - w / 2, w, h, g);
if (!valid(i)) return null;
S.items.push(i); return i;
}
function rel(base, lx, ly, t, o) {
o = o || {};
var c = CAT[t], i = { id: uid++, t: t, w: o.w || c.w, h: o.h || c.h, r: (base.r + (o.dr || 0)) % 4 }, p = abs(base, lx, ly);
i.x = Math.round(p[0] - bw(i) / 2); i.y = Math.round(p[1] - bh(i) / 2); return i;
}
function add(i, loose) { if (!i) return null; if (loose) fit(i); if (loose ? inside(i) : valid(i)) { S.items.push(i); return i; } return null; }
function drop(i) { var k = S.items.indexOf(i); if (k >= 0) S.items.splice(k, 1); }
function longest(wl, depth, noWin) { var m = 0; wallFree(wl, depth, noWin).forEach(function (v) { m = Math.max(m, v[1] - v[0]); }); return m; }
function penalty(noWalk, coarse) { var n = 0; COARSE = !!coarse; check(noWalk).forEach(function (c) { n += c.st === 'bad' ? 20 : c.st === 'warn' ? 3 : c.st === 'info' ? 0.4 : 0; }); COARSE = false; return n; }
var depth = 0;
function choose(vars, build, strict) {
var keep = S.items.slice(), nested = depth > 0, r;
function run(walkToo) {
var base = strict ? penalty(false) : 0, bs = null, out = null;
vars.forEach(function (v) {
S.items = keep.slice();
var pref = build(v); if (pref == null) return;
var pen = penalty(!walkToo, !strict); if (strict && pen > base + 0.01) return;
if (bs == null || pref - pen > bs) { bs = pref - pen; out = { items: S.items.slice(), pref: pref }; }
});
return out;
}
depth++; r = run(!!strict); depth--;
if (r && !strict && !nested) { S.items = r.items; if (penalty(false) > penalty(true) + 0.01) { depth++; r = run(true) || r; depth--; } }
S.items = r ? r.items : keep; return r ? { pref: r.pref } : null;
}
var WALLS = ['N', 'E', 'S', 'W'], ENDS = [null, 'a', 'b'];
function combos(a, b, c) { var out = []; a.forEach(function (x) { b.forEach(function (y) { (c || [0]).forEach(function (z) { out.push([x, y, z]); }); }); }); return out; }
function doorMid() { var o = S.doors[0]; return o ? wallPt(o.wall, o.pos + o.size / 2) : [S.w / 2, S.d]; }
function far(p) { var m = doorMid(); return Math.hypot(p[0] - m[0], p[1] - m[1]) / Math.hypot(S.w, S.d); }
function plant() {
var c = CAT.pflanze, m = 8, wn = S.wins[0], ref = wn ? wallPt(wn.wall, wn.pos + wn.size / 2) : [S.w / 2, 0];
choose([[m, m], [S.w - c.w - m, m], [m, S.d - c.h - m], [S.w - c.w - m, S.d - c.h - m]], function (q) {
var i = add({ id: uid++, t: 'pflanze', w: c.w, h: c.h, r: 0, x: Math.round(q[0]), y: Math.round(q[1]) });
return i ? -Math.hypot(q[0] - ref[0], q[1] - ref[1]) / 100 : null;
}, true);
}
function lampBy(base) { choose([[-24, 28], [base.w + 24, 28]], function (q) { return add(rel(base, q[0], q[1], 'lampe')) ? 0 : null; }, true); }
function pWohnen() {
var A = S.w * S.d / 1e4;
choose(combos(WALLS, ['sofa3', 'sofa2'], ENDS), function (v) {
var wl = v[0], t = v[1], end = v[2], len = wallLen(wl), horiz = wl === 'N' || wl === 'S', dep = horiz ? S.d : S.w;
if (t === 'sofa3' && A < 12) return null;
var away = Math.max(5, r5(dep - CAT[t].h - 40 - 520));
var s = putWall(t, wl, { gap: away, end: end, pad: end ? 10 : 0, noWin: false }); if (!s) return null;
var room = dep - away - s.h, c0 = abs(s, s.w / 2, 0), cen = horiz ? c0[0] : c0[1];
var tv = putWall('tv', OPP[wl], { center: cen, w: len >= 300 ? 160 : 120, noWin: false }), tvd = tv ? tv.h : 0;
var tl = Math.round(s.w * 0.55 / 10) * 10, td = room - tvd >= 45 + 60 + RULE.walk ? 60 : 50;
if (room - tvd >= 45 + td + 45) add(rel(s, s.w / 2, s.h + 45 + td / 2, 'couch', { w: tl, h: td }));
var rug = null;
RULE.rugs.forEach(function (q) { if (!rug && q[1] >= s.w + RULE.rug[0] && q[1] <= len - 10 && s.h - RULE.rugUnder + q[0] <= room + s.h - tvd - 10) rug = q; });
if (rug) add(rel(s, s.w / 2, s.h - RULE.rugUnder + rug[0] / 2, 'teppich', { w: rug[1], h: rug[0] }), true);
var view = room - tvd;
return (t === 'sofa3' ? 1.2 : 0) + (end ? 0 : 0.6) + (tv ? 2 : -3) + (hasDoor(wl) ? -0.6 : 0.4) + (hasWin(wl) ? -0.8 : 0.3) + (hasWin(OPP[wl]) ? -1.5 : 0.3) + (view >= 200 && view <= 430 ? 1.5 : view < 150 ? -3 : view > 520 ? -1 : 0) + (len >= dep ? 0.3 : 0);
});
var sofa = S.items.filter(function (i) { return CAT[i.t].k === 'sofa'; })[0]; if (!sofa) return;
var table = S.items.filter(function (i) { return i.t === 'couch'; })[0];
if (A >= 15 && table) {
var off = table.w / 2 + 45 + 85 / 2, ly = sofa.h + 45 + table.h / 2;
choose(combos([[sofa.w / 2 + off, 1], [sofa.w / 2 - off, 3]], [5, 25]), function (v) {
var ch = add(rel(sofa, v[0][0], ly + v[1], 'sessel', { dr: v[0][1] })); return ch ? far(abs(sofa, v[0][0], ly)) - v[1] / 100 : null;
}, true);
}
choose(combos(WALLS, ENDS), function (v) { var i = putWall('regal', v[0], { end: v[1], pad: 6, clear: 30 }); return i ? (v[1] ? 0.2 : 0) + (v[0] === BK[sofa.r] ? -0.5 : 0) : null; }, true);
lampBy(sofa); plant();
}
function pSchlafen() {
var A = S.w * S.d / 1e4, mn = Math.min(S.w, S.d);
var wardrobes = combos(WALLS, [250, 200, 150, 100], ENDS).concat([null]);
choose(combos(['bett180', 'bett140', 'bett90'], WALLS, ENDS), function (v) {
var t = v[0], wl = v[1], c = CAT[t], dep = wl === 'N' || wl === 'S' ? S.d : S.w;
if (t === 'bett180' && (A < 11 || mn < 280)) return null;
if (t === 'bett90' && !v[2]) return null;
var b = putWall(t, wl, { end: v[2], noWin: false }); if (!b) return null;
var n1 = add(rel(b, -25, 22, 'nacht')), n2 = t === 'bett90' && n1 ? null : add(rel(b, b.w + 25, 22, 'nacht'));
var pref = { bett180: 3, bett140: 1.6, bett90: A < 9 ? 2.2 : 0 }[t] + (hasDoor(wl) ? -2 : 0.5) + (hasWin(wl) ? -1.2 : 0.5) + (dep >= c.h + RULE.walk ? 0.5 : -3) + (n1 && n2 ? 0.5 : n1 || n2 ? 0.2 : 0) + (v[2] ? 0 : 0.3) + 0.3 * far(abs(b, b.w / 2, b.h / 2));
var w = choose(wardrobes, function (q) {
if (!q) return -1.5;
var i = putWall('schrank', q[0], { w: q[1], end: q[2], pad: 0 }); return i ? q[1] / 100 + (q[0] === wl ? -0.6 : 0) + (q[2] ? 0.2 : 0) : null;
});
return pref + (w ? w.pref : -1.5);
});
var bed = S.items.filter(function (i) { return CAT[i.t].k === 'bett'; })[0]; if (!bed) return;
choose(combos(WALLS, ENDS), function (v) { var i = putWall('kommode', v[0], { end: v[1], pad: 6, noWin: false, clear: 30 }); return i ? (hasWin(v[0]) ? -0.3 : 0) : null; }, true);
var rug = null;
RULE.rugs.forEach(function (q) { if (!rug && q[1] >= bed.w + 2 * RULE.rugBed[0]) rug = q; });
if (rug) choose([1], function () { var r = rel(bed, bed.w / 2, bed.h + 55 - rug[0] / 2, 'teppich', { w: rug[1], h: rug[0] }); if (!inside(r)) return null; S.items.push(r); return 0; }, true);
plant();
}
function pEssen() {
var A = S.w * S.d / 1e4, cx = S.w / 2, cy = S.d / 2;
choose(combos([[200, 100], [160, 90], [120, 80]], [0, 1], [[0, 0], [30, 0], [-30, 0], [0, 30], [0, -30], [60, 0], [-60, 0], [0, 60], [0, -60]]), function (v) {
var q = v[0]; if (q[0] >= 200 && A < 16) return null;
var t = { id: uid++, t: 'ess', w: q[0], h: q[1], r: v[1] }; t.x = Math.round(cx - bw(t) / 2 + v[2][0]); t.y = Math.round(cy - bh(t) / 2 + v[2][1]);
if (!add(t)) return null;
return q[0] / 100 + ((S.w >= S.d) === (v[1] === 0) ? 0.5 : 0) - (Math.abs(v[2][0]) + Math.abs(v[2][1])) / 100;
});
choose(combos(WALLS, ENDS), function (v) { var i = putWall('side', v[0], { end: v[1], pad: 6, noWin: false }); return i ? (hasWin(v[0]) ? -0.4 : 0) + (v[1] ? 0 : 0.2) : null; }, true);
plant();
}
function pArbeiten() {
var wn = S.wins[0], adj = wn ? (wn.wall === 'N' || wn.wall === 'S' ? ['W', 'E'] : ['N', 'S']) : [], near = wn ? (wn.wall === 'N' || wn.wall === 'W' ? 'a' : 'b') : null;
choose(combos(WALLS, [[140, 70], [120, 60]], ENDS), function (v) {
var d = putWall('schreib', v[0], { w: v[1][0], h: v[1][1], end: v[2], pad: v[2] ? 25 : 0, noWin: false }); if (!d) return null;
return v[1][0] / 100 + (adj.indexOf(v[0]) >= 0 ? 1.5 + (v[2] === near ? 0.8 : 0) : 0) + (hasDoor(v[0]) ? -0.5 : 0) + (wn && v[0] === OPP[wn.wall] ? -0.6 : 0);
});
var desk = S.items.filter(function (i) { return i.t === 'schreib'; })[0]; if (!desk) return;
for (var n = 0; n < 2; n++) choose(combos(WALLS, ENDS), function (v) { var i = putWall('regal', v[0], { end: v[1], pad: n ? 0 : 6, clear: 30 }); return i ? (v[0] === BK[desk.r] ? 0.3 : 0) + (v[1] ? 0.1 : 0) : null; }, true);
if (S.w * S.d / 1e4 >= 11 && choose(combos(WALLS, ['a', 'b']), function (v) { var c = putWall('sessel', v[0], { end: v[1], gap: 8, pad: 12, noWin: false, clear: 40 }); return c ? 0.5 * far(abs(c, c.w / 2, c.h / 2)) : null; }, true)) {
lampBy(S.items[S.items.length - 1]);
}
plant();
}
function pFlur() {
var horiz = S.w >= S.d, sh = Math.min(S.w, S.d), lg = Math.max(S.w, S.d), walls = horiz ? ['N', 'S'] : ['W', 'E'];
choose(combos(walls, ['a', 'b']), function (v) { return putWall('schuh', v[0], { end: v[1], pad: 12, noWin: false }) ? 0 : null; }, true);
choose(combos(walls, ENDS), function (v) { return putWall('garderobe', v[0], { end: v[1], pad: 12 }) ? (v[1] ? 0 : 0.2) : null; }, true);
choose(combos(walls, ENDS), function (v) { return putWall('bank', v[0], { end: v[1], pad: 12, noWin: false }) ? 0 : null; }, true);
var rw = Math.max(60, Math.min(120, r5(sh - 25))), rl = Math.max(120, r5(lg - 80));
if (sh >= 90 && rl <= lg) { var r = { id: uid++, t: 'laeufer', w: rl, h: rw, r: horiz ? 0 : 1 }; r.x = Math.round((S.w - bw(r)) / 2); r.y = Math.round((S.d - bh(r)) / 2); S.items.push(r); }
}
function preset(type) {
if (type) S.type = TYPES[type] ? type : 'leer';
S.items = [];
({ wohnen: pWohnen, schlafen: pSchlafen, essen: pEssen, arbeiten: pArbeiten, flur: pFlur }[S.type] || function () { })();
S.items = S.items.filter(function (i) { return inside(i); });
return S;
}
function spot(i) {
var cx = (S.w - bw(i)) / 2, cy = (S.d - bh(i)) / 2, R = Math.max(S.w, S.d), best = null;
for (var rr = 0; rr <= R && !best; rr += 15) for (var a = 0; a < 16 && !best; a++) {
var x = Math.round((cx + Math.cos(a * Math.PI / 8) * rr) / 5) * 5, y = Math.round((cy + Math.sin(a * Math.PI / 8) * rr) / 5) * 5, u = { id: i.id, t: i.t, w: i.w, h: i.h, r: i.r, flip: i.flip, x: x, y: y };
if (valid(u)) best = u; if (!rr) break;
}
if (best) { i.x = best.x; i.y = best.y; } else { i.x = Math.round(Math.max(0, cx)); i.y = Math.round(Math.max(0, cy)); }
return i;
}
function check(noWalk) {
var out = [], solid = S.items.filter(function (i) { return !CAT[i.t].flat; }), i, j;
var kinds = function (ks) { return S.items.filter(function (it) { return ks.indexOf(CAT[it.t].k) >= 0; }); };
var sofas = kinds(['sofa', 'eck']), tables = S.items.filter(function (it) { return it.t === 'couch' || it.t === 'couchr'; }), tvs = kinds(['tv']), beds = kinds(['bett']), dine = kinds(['ess', 'essr']);
var rugs = S.items.filter(function (it) { return CAT[it.t].flat; });
var small = function (me) { return function (o) { return o === me || !!CAT[o.t].small; }; };
var pairs = [], badIds = {};
for (i = 0; i < solid.length; i++) for (j = i + 1; j < solid.length; j++) if (overlap(solid[i], solid[j])) { pairs.push([solid[i], solid[j]]); badIds[solid[i].id] = badIds[solid[j].id] = 1; }
if (pairs.length) out.push({ k: 'ov', st: 'bad', t: 'Möbel stehen ineinander', x: pairs.slice(0, 3).map(function (p) { return noun(p[0]) + ' und ' + noun(p[1]); }).join(', ') + (pairs.length > 3 ? ' und weitere' : '') + '. Zieh sie auseinander.', ids: Object.keys(badIds).map(Number) });
var blocked = 0;
S.doors.forEach(function (o, k) {
if (!o.inw) return;
var hits = solid.filter(function (it) { return rects(it).some(function (q) { return inSwing(o, q); }); });
if (hits.length) { blocked++; out.push({ k: 'door' + k, st: 'bad', t: 'Die Tür stößt an', x: 'Im Schwenkbereich der Tür ' + (hits.length > 1 ? 'stehen' : 'steht') + ': ' + list(hits.map(noun)) + '.', ids: hits.map(function (h) { return h.id; }), door: k }); }
});
if (S.doors.some(function (o) { return o.inw; }) && !blocked) out.push({ k: 'door', st: 'ok', t: 'Tür', x: S.doors.length > 1 ? 'Alle Türen gehen frei auf.' : 'Die Tür geht frei auf.' });
var W = noWalk ? { list: [] } : walk();
if (!W) out.push({ k: 'walk', st: 'info', t: 'Laufwege', x: 'Zeichne eine Tür ein, dann prüfen wir die Wege durch den Raum.' });
else if (W.list.length) {
var needW = W.need, tight = W.list.filter(function (e) { return e.v < needW - 3; }).sort(function (a, b) { return a.v - b.v; });
var label = function (e) { return e.it ? zu(e.it) : 'zur zweiten Tür'; };
if (!tight.length) out.push({ k: 'walk', st: 'ok', t: 'Laufwege', x: 'Von der Tür kommst du überall mit mindestens ' + needW + ' cm durch.' });
else {
var none = tight.filter(function (e) { return e.v < 30; }), some = tight.filter(function (e) { return e.v >= 30; }), w0 = tight[0], txt = [];
if (none.length) txt.push('Kein Durchkommen ' + list(uniq(none.map(label)).slice(0, 3)) + '.');
if (some.length) txt.push('Eng wird es auf dem Weg ' + list(uniq(some.map(function (e) { return label(e) + ' (rund ' + r5(e.v) + ' cm)'; })).slice(0, 3)) + '.');
txt.push(S.type === 'flur' ? 'Im Flur sollten ' + needW + ' cm frei bleiben.' : 'Als Richtwert gelten ' + needW + ' cm.');
out.push({ k: 'walk', st: w0.v < needW - 15 ? 'bad' : 'warn', t: w0.v < 30 ? 'Weg versperrt' : w0.v < needW - 15 ? 'Laufweg zu eng' : 'Laufweg knapp', x: txt.join(' '), circle: w0.pinch && w0.v >= 10 ? { x: w0.pinch.x, y: w0.pinch.y, r: Math.max(8, w0.pinch.r), l: 'rund ' + r5(w0.v) + ' cm' } : null, ids: tight.filter(function (e) { return e.it; }).slice(0, 3).map(function (e) { return e.it.id; }) });
}
}
sofas.forEach(function (s) {
var n = VEC[FR[s.r]], p = ctr(s), best = null;
tables.forEach(function (t) { var c = ctr(t); if ((c.x - p.x) * n[0] + (c.y - p.y) * n[1] <= 0) return; var L = linkItems(s, t); if (L.d < 160 && (!best || L.d < best.d)) best = L; });
if (!best) return;
var dd = Math.round(best.d), e = { k: 'tbl' + s.id, t: 'Sofa und Couchtisch', dims: [{ x1: best.x1, y1: best.y1, x2: best.x2, y2: best.y2, l: dd }], ids: [s.id] };
if (dd >= RULE.table[0] - 3 && dd <= RULE.table[1] + 3) { e.st = 'ok'; e.x = cm(dd) + ' Abstand. 40 bis 50 cm sind bequem.'; }
else if (dd < RULE.table[0]) { e.st = 'warn'; e.x = 'Nur ' + cm(dd) + ' zwischen Sofa und Couchtisch. Bequem sind 40 bis 50 cm.'; }
else { e.st = 'warn'; e.x = cm(dd) + ' zwischen Sofa und Couchtisch. Bei 40 bis 50 cm kommst du im Sitzen gut heran.'; }
out.push(e);
});
var tvInfo = null;
tvs.forEach(function (t) {
var best = null, c = ctr(t);
sofas.forEach(function (s) {
var l = CAT[s.t].k === 'eck' ? legOf(s) : s.h, e = abs(s, s.w / 2, l * 0.32), n = VEC[FR[s.r]], vx = c.x - e[0], vy = c.y - e[1], along = vx * n[0] + vy * n[1], side = Math.abs(vx * n[1] - vy * n[0]);
if (along <= 40 || side > along) return;
var dd = Math.hypot(vx, vy); if (!best || dd < best.d) best = { d: dd, e: e };
});
if (!best) { if (sofas.length) out.push({ k: 'tv' + t.id, st: 'info', t: 'Fernseher', x: 'Das Sofa schaut nicht zum Fernseher. Dreh eines von beiden, dann messen wir den Sitzabstand.', ids: [t.id] }); return; }
var zoll = best.d / RULE.tv / 2.54, size = 0;
TVS.forEach(function (z) { if (z <= zoll + 0.5) size = z; });
var e2 = { k: 'tv' + t.id, st: 'ok', t: 'Abstand zum Fernseher', dims: [{ x1: best.e[0], y1: best.e[1], x2: c.x, y2: c.y, l: met(best.d), dash: 1 }], ids: [t.id] };
if (size) { e2.x = 'Du sitzt rund ' + met(best.d) + ' entfernt. ' + (size === 85 && zoll > 90 ? 'Bei 4K passt jede gängige Größe bis 85 Zoll.' : 'Bei 4K passt ein Fernseher bis etwa ' + size + ' Zoll, kleiner geht immer.'); if (!tvInfo) tvInfo = { d: best.d, z: size }; }
else { e2.st = 'warn'; e2.x = 'Du sitzt nur rund ' + met(best.d) + ' vom Fernseher entfernt. Das ist selbst für ein kleines Gerät nah.'; }
out.push(e2);
});
rugs.forEach(function (r) {
var rb = box(r), e = { k: 'rug' + r.id, t: 'Teppich', ids: [r.id] }, ctx = null, area = function (a, b) { return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); };
dine.forEach(function (t) { var b = box(t); if (!ctx && area(rb, b) >= 0.6 * b.w * b.h) ctx = { k: 'dine', it: t }; });
if (!ctx) beds.forEach(function (b0) { var b = box(b0); if (!ctx && area(rb, b) >= 0.2 * b.w * b.h) ctx = { k: 'bed', it: b0 }; });
if (!ctx) sofas.forEach(function (s) { var b = box(s), z = { x: b.x - 40, y: b.y - 40, w: b.w + 80, h: b.h + 80 }; if (!ctx && area(rb, z) > 0) ctx = { k: 'sofa', it: s }; });
if (!ctx || r.t === 'laeufer') return;
var it = ctx.it, b = box(it);
if (ctx.k === 'sofa') {
var horiz = it.r % 2 === 0, wider = Math.round((horiz ? rb.w : rb.h) - it.w), under = horiz ? Math.min(rb.y + rb.h, b.y + b.h) - Math.max(rb.y, b.y) : Math.min(rb.x + rb.w, b.x + b.w) - Math.max(rb.x, b.x);
var want = null; RULE.rugs.forEach(function (q) { if (!want && q[1] >= it.w + RULE.rug[0]) want = q; });
if (wider < RULE.rug[0] - 3) { e.st = 'warn'; e.x = (wider <= 0 ? 'Der Teppich ist nicht breiter als das Sofa.' : 'Der Teppich ist nur ' + cm(wider) + ' breiter als das Sofa.') + ' Faustregel: 30 bis 50 cm breiter' + (want ? ', gängig wäre ' + want[0] + ' × ' + want[1] + ' cm.' : '.'); }
else if (under < 12) { e.st = 'warn'; e.x = 'Der Teppich liegt nicht unter den vorderen Sofafüßen. Schieb ihn ein Stück unter das Sofa.'; }
else { e.st = 'ok'; e.x = 'Der Teppich ist ' + cm(wider) + ' breiter als das Sofa, die vorderen Füße stehen darauf.'; }
} else if (ctx.k === 'dine') {
var mg = Math.round(Math.min(b.x - rb.x, rb.x + rb.w - b.x - b.w, b.y - rb.y, rb.y + rb.h - b.y - b.h));
if (mg >= RULE.chair[0] - 3) { e.st = 'ok'; e.x = 'Der Teppich steht rundum mindestens ' + cm(mg) + ' über die Tischkante. So bleiben die Stühle beim Zurückschieben darauf.'; }
else { e.st = 'warn'; e.x = 'Der Teppich steht an der schmalsten Seite ' + (mg > 0 ? 'nur ' + cm(mg) : 'gar nicht') + ' über die Tischkante. Damit die Stühle beim Zurückschieben darauf bleiben, braucht es 60 bis 80 cm.'; }
} else {
var m4 = { N: b.y - rb.y, S: rb.y + rb.h - b.y - b.h, W: b.x - rb.x, E: rb.x + rb.w - b.x - b.w }, vis = [LF[it.r], RT[it.r]].map(function (dr) { return [m4[dr], gap(b, dr, small(it)).d]; }).filter(function (v) { return v[1] > 25; }).map(function (v) { return Math.round(v[0]); });
if (!vis.length) return;
var mn = Math.min.apply(null, vis);
if (mn >= RULE.rugBed[0] - 3) { e.st = 'ok'; e.x = 'Der Teppich schaut neben dem Bett ' + cm(mn) + ' hervor.'; }
else { e.st = 'warn'; e.x = 'Der Teppich schaut neben dem Bett ' + (mn > 0 ? 'nur ' + cm(mn) : 'nicht') + ' hervor. Die Faustregel sind 50 bis 60 cm.'; }
}
out.push(e);
});
beds.forEach(function (b0) {
var b = box(b0), sk = small(b0), L = gap(b, LF[b0.r], sk), R = gap(b, RT[b0.r], sk), nd = RULE.bed - 2, e = { k: 'bed' + b0.id, t: 'Platz am Bett', ids: [b0.id], dims: [] };
[L, R].forEach(function (g) { if (g.d > 12) e.dims.push(gapLine(b, g)); });
if (b0.w >= 140) {
if (L.d >= nd && R.d >= nd) { e.st = 'ok'; e.x = L.d === R.d ? 'Links und rechts vom Bett sind je ' + cm(L.d) + ' frei.' : 'Neben dem Bett sind ' + cm(Math.min(L.d, R.d)) + ' und ' + cm(Math.max(L.d, R.d)) + ' frei.'; }
else if (Math.min(L.d, R.d) <= 12) { e.st = 'warn'; e.x = 'Eine Seite des Betts ist zugestellt. Wer dort schläft, klettert über die andere Seite.' + (Math.max(L.d, R.d) < nd ? ' Auf der freien Seite sind es ' + cm(Math.max(L.d, R.d)) + ', bequem sind 80 cm.' : ''); }
else { e.st = 'warn'; e.x = 'Neben dem Bett sind an der schmalen Seite nur ' + cm(Math.min(L.d, R.d)) + ' frei. Bequem sind 80 cm.'; }
} else {
var mx = Math.max(L.d, R.d);
if (mx >= nd) { e.st = 'ok'; e.x = 'Neben dem Bett sind ' + cm(mx) + ' frei.'; } else { e.st = 'warn'; e.x = 'Neben dem Bett sind nur ' + cm(mx) + ' frei. Bequem sind 80 cm.'; }
}
out.push(e);
});
S.items.forEach(function (w) {
if (w.t !== 'schrank') return;
var b = box(w), g = gap(b, FR[w.r], function (o) { return o === w; }), e = { k: 'wd' + w.id, t: 'Vor dem Kleiderschrank', ids: [w.id], dims: [gapLine(b, g)] };
if (g.d >= RULE.wardrobe - 2) { e.st = 'ok'; e.x = cm(g.d) + ' frei. Die Türen gehen gut auf.'; }
else { e.st = 'warn'; e.x = 'Nur ' + cm(g.d) + ' frei. Damit die Türen gut aufgehen, sind 80 cm besser.'; }
out.push(e);
});
dine.forEach(function (t) {
var ch = chairs(t), e = { k: 'dine' + t.id, t: 'Esstisch', ids: [t.id], dims: [] }, b = box(t);
if (!ch.n) { e.st = 'warn'; e.x = 'Der Esstisch ist rundum zugestellt. Zum Sitzen braucht jede Seite mindestens 60 cm Platz.'; out.push(e); return; }
if (ch.minDir) e.dims.push(gapLine(b, ch.gaps[ch.minDir]));
var pers = 'Platz für ' + ch.n + ' Personen';
if (ch.min >= RULE.chair[0] - 2) { e.st = 'ok'; e.x = pers + '. Hinter den Stühlen sind mindestens ' + cm(ch.min) + ' frei.'; }
else { e.st = 'warn'; e.x = pers + '. An der engsten Seite sind aber nur ' + cm(ch.min) + ' frei. Zum Zurückschieben der Stühle braucht es 60 bis 80 cm.'; }
out.push(e);
});
S.wins.forEach(function (wn, k) {
var z = front(wn, 45), hits = solid.filter(function (it) { return !CAT[it.t].small && rects(it).some(function (q) { return hit(q, z); }); });
if (!hits.length) return;
var tall = hits.filter(function (it) { return CAT[it.t].tall; }), h0 = (tall[0] || hits[0]), e = { k: 'win' + k, t: 'Fenster', ids: hits.map(function (h) { return h.id; }) };
if (tall.length) { e.st = 'warn'; e.x = 'Vor dem Fenster steht ' + nom(h0) + '. Das nimmt Licht, und der Flügel geht nicht mehr ganz auf.'; }
else { e.st = 'info'; e.x = 'Vor dem Fenster steht ' + nom(h0) + '. Zum Öffnen greifst du darüber.' + (CAT[h0.t].k === 'sofa' || CAT[h0.t].k === 'eck' ? ' Ist dort ein Heizkörper, lass 20 cm Abstand.' : ''); }
out.push(e);
});
sofas.forEach(function (s) {
var g = gap(box(s), BK[s.r], function (o) { return o === s; });
if (!g.who && g.d < 4) out.push({ k: 'wall' + s.id, st: 'info', t: 'Sofa an der Wand', x: 'Rück das Sofa 5 bis 10 cm von der Wand ab. So kann dahinter Luft zirkulieren.', ids: [s.id] });
});
out.tv = tvInfo;
return out;
}
function uniq(a) { return a.filter(function (v, k) { return a.indexOf(v) === k; }); }
function shop(ck) {
var out = [], A = S.w * S.d / 1e4, has = function (ks) { return S.items.filter(function (it) { return ks.indexOf(it.t) >= 0; }); };
var sofa = has(['sofa3', 'sofa2', 'eck'])[0], bed = has(['bett180', 'bett140', 'bett90'])[0], tbl = has(['ess', 'essr'])[0], rugs = has(['teppich', 'teppichr']);
function rugFor(len) { var q = null; RULE.rugs.forEach(function (r) { if (!q && r[1] >= len) q = r; }); return q; }
if (sofa) {
if (!rugs.length) { var q = rugFor(sofa.w + RULE.rug[0]); if (q) out.push({ t: 'Teppich ' + q[0] + ' × ' + q[1] + ' cm', x: '30 bis 50 cm breiter als dein Sofa (' + cm(sofa.w) + '). Die vorderen Füße stehen darauf.', q: 'Teppich ' + q[0] + 'x' + q[1] }); }
if (!has(['couch', 'couchr']).length) { var lo = r5(sofa.w * RULE.tableLen[0]), hi = r5(sofa.w * RULE.tableLen[1]); out.push({ t: 'Couchtisch ' + lo + ' bis ' + hi + ' cm lang', x: 'Halb bis zwei Drittel so lang wie das Sofa, etwa so hoch wie die Sitzfläche und 40 bis 50 cm davor.', q: 'Couchtisch ' + Math.round((lo + hi) / 20) * 10 + ' cm' }); }
}
if (ck && ck.tv) out.push({ t: 'Fernseher bis ' + ck.tv.z + ' Zoll', x: 'Passt bei 4K zu deinen rund ' + met(ck.tv.d) + ' Sitzabstand. Kleiner geht immer.', q: 'Fernseher ' + ck.tv.z + ' Zoll 4K' });
if (tbl) out.push({ t: 'Pendelleuchte für den Esstisch', x: 'Die Unterkante hängt 60 bis 80 cm über der Tischplatte.' + (tbl.w >= 200 && tbl.t === 'ess' ? ' Bei einem so langen Tisch passen auch zwei Leuchten nebeneinander.' : ''), q: 'Pendelleuchte Esstisch' });
if (bed && !rugs.length) { var qb = rugFor(bed.w + 2 * RULE.rugBed[0]); if (qb) out.push({ t: 'Teppich ' + qb[0] + ' × ' + qb[1] + ' cm unters Bett', x: 'Quer gelegt schaut er links und rechts gut 50 cm hervor.', q: 'Teppich ' + qb[0] + 'x' + qb[1] }); }
var seen = {};
S.wins.forEach(function (wn) { if (seen[wn.size] || Object.keys(seen).length >= 2) return; seen[wn.size] = 1; var a = wn.size + 2 * RULE.rod[0], b = wn.size + 2 * RULE.rod[1]; out.push({ t: 'Gardinenstange ' + a + ' bis ' + b + ' cm', x: 'Je Seite 15 bis 20 cm breiter als dein Fenster (' + cm(wn.size) + ').', q: 'Gardinenstange ' + Math.ceil(b / 20) * 20 + ' cm' }); });
var lm = RULE.lumen[S.type];
if (lm) { var a1 = Math.round(A * lm[0] / 100) * 100, a2 = Math.round(A * lm[1] / 100) * 100, n1 = Math.max(1, Math.ceil(a1 / RULE.bulb)), n2 = Math.max(1, Math.ceil(a2 / RULE.bulb)); out.push({ t: 'Licht: ' + (a1 === a2 ? fz(a1) : fz(a1) + ' bis ' + fz(a2)) + ' Lumen', x: 'Für ' + fz(A, 1) + ' m², verteilt auf mehrere Leuchten. Das sind ' + (n1 === n2 ? n1 : n1 + ' bis ' + n2) + ' Lampen mit je 800 Lumen.', q: S.type === 'arbeiten' ? 'LED E27 neutralweiß 806 Lumen' : 'LED E27 warmweiß 806 Lumen dimmbar' }); }
return out;
}
function enc() {
var p = [S.w + 'x' + S.d + '.' + S.type];
S.doors.forEach(function (o) { p.push('d' + o.wall + '.' + o.pos + '.' + o.size + '.' + (o.hinge ? 1 : 0) + '.' + (o.inw ? 1 : 0)); });
S.wins.forEach(function (o) { p.push('f' + o.wall + '.' + o.pos + '.' + o.size); });
S.items.forEach(function (i) { p.push('m' + i.t + '.' + i.x + '.' + i.y + '.' + i.w + '.' + i.h + '.' + i.r + (i.flip ? '.1' : '')); });
return p.join('~');
}
function dec(str) {
try {
var p = String(str).split('~'), h = p[0].split('.'), wd = h[0].split('x');
if (wd.length !== 2 || !/^\d{2,5}$/.test(wd[0]) || !/^\d{2,5}$/.test(wd[1])) return null;
var o = { w: Math.round(lim(wd[0], LIM.room[0], LIM.room[1])), d: Math.round(lim(wd[1], LIM.room[0], LIM.room[1])), type: TYPES[h[1]] ? h[1] : 'leer', doors: [], wins: [], items: [] };
if (!(o.w > 0) || !(o.d > 0)) return null;
var len = function (w) { return w === 'N' || w === 'S' ? o.w : o.d; }, id = 1;
p.slice(1).forEach(function (seg) {
var k = seg.charAt(0), a = seg.slice(1).split('.');
if (k === 'd' || k === 'f') {
var wl = a[0].charAt(0); if ('NESW'.indexOf(wl) < 0) return; a.shift();
var L = k === 'd' ? LIM.door : LIM.win, size = Math.round(lim(a[1], L[0], Math.min(L[1], len(wl)))), pos = Math.round(lim(a[0], 0, len(wl) - size));
if (!(size > 0) || !(pos >= 0)) return;
if (k === 'd') { if (o.doors.length < LIM.doors) o.doors.push({ wall: wl, pos: pos, size: size, hinge: a[2] === '1' ? 1 : 0, inw: a[3] === '0' ? 0 : 1 }); }
else if (o.wins.length < LIM.wins) o.wins.push({ wall: wl, pos: pos, size: size });
} else if (k === 'm') {
if (!CAT[a[0]] || o.items.length >= LIM.items) return;
var it = { id: id++, t: a[0], w: Math.round(lim(a[3], LIM.item[0], LIM.item[1])), h: Math.round(lim(a[4], LIM.item[0], LIM.item[1])), r: ((parseInt(a[5], 10) || 0) % 4 + 4) % 4, x: Math.round(+a[1]), y: Math.round(+a[2]) };
if (!(it.w > 0) || !(it.h > 0) || !isFinite(it.x) || !isFinite(it.y)) return;
if (a[6] === '1') it.flip = 1;
if (it.r % 2) { it.h = Math.min(it.h, o.w); it.w = Math.min(it.w, o.d); } else { it.w = Math.min(it.w, o.w); it.h = Math.min(it.h, o.d); }
it.x = Math.max(0, Math.min(o.w - bw(it), it.x)); it.y = Math.max(0, Math.min(o.d - bh(it), it.y));
o.items.push(it);
}
});
return o;
} catch (e) { return null; }
}
var RP = {
RULE: RULE, CAT: CAT, GROUPS: GROUPS, TYPES: TYPES, LIM: LIM, FR: FR, BK: BK, LF: LF, RT: RT, VEC: VEC, WALLNAME: WALLNAME,
START: START, def: def, use: use, state: state, newId: newId, lim: lim, bw: bw, bh: bh, box: box, ctr: ctr, abs: abs, rects: rects, legOf: legOf, isRound: isRound, overlap: overlap,
wallLen: wallLen, wallPt: wallPt, swing: swing, blocksDoor: blocksDoor, inside: inside, fit: fit, valid: valid, gap: gap, chairs: chairs, solids: solids,
walk: walk, preset: preset, spot: spot, check: check, shop: shop, enc: enc, dec: dec, noun: noun, cm: cm, met: met, fz: fz
};
if (typeof module !== 'undefined' && module.exports) module.exports = RP; else G.RP = RP;
})(typeof window !== 'undefined' ? window : this);
(function () {
'use strict';
if (typeof document === 'undefined') return;
var d = document, root = d.getElementById('rp'), RP = window.RP;
if (!root || !RP) return;
var CAT = RP.CAT, TAG = 'stildaheim-21', NS = 'http://www.w3.org/2000/svg', KEY = 'sdrp';
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function (id) { return d.getElementById(id); };
function E(t, a, p) { var e = d.createElementNS(NS, t); for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
function H(t, a, txt) { var e = d.createElement(t); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; }
function R(g, x, y, w, h, r, c) { return E('rect', { x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), rx: r || null, 'class': c }, g); }
function L(g, x1, y1, x2, y2, c) { return E('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': c }, g); }
function P(g, dd, c) { return E('path', { d: dd, 'class': c }, g); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function toast(m) { if (window.sdToast) window.sdToast(m); }
function num(v) { var t = String(v).trim().replace(/\s|cm|m\b/gi, ''); if (t.indexOf(',') > -1) t = t.replace(/\./g, '').replace(',', '.'); var n = parseFloat(t); return isFinite(n) ? n : NaN; }
var EXT = '<svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13" style="margin-left:5px;vertical-align:-1px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
function ic(p) { return '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
var IC = { rot: ic('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'), flip: ic('<path d="M12 3v18M7 8l-4 4 4 4M17 8l4 4-4 4"/>'), dup: ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'), del: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'), x: ic('<path d="M6 6l12 12M18 6L6 18"/>'), swap: ic('<path d="M7 7h13l-4-4M17 17H4l4 4"/>') };
var S, sel = null, focusCk = null, undo = [], pristine = true, CK = [], drag = null, shared = false;
var host = $('rp-plan'), svg, gRoom, gItems, gOpen, gOver, els = {}, doorEls = [], winEls = [];
var K = 1, OX = 0, OY = 0, VW = 0, VH = 0, T = 8, FS = 12, lastW = 0, group = 0;
function load() {
var q = null, st = null;
try { q = new URLSearchParams(location.search).get('p'); } catch (e) { }
var own = null; try { own = localStorage.getItem(KEY); } catch (e) { }
if (q) { st = RP.dec(q); if (st && own && own !== q && RP.dec(own)) { undo.push(own + '|0'); shared = true; } }
if (!st && own) st = RP.dec(own);
if (st) { RP.use(st); pristine = false; } else { st = RP.dec(RP.START); if (st) RP.use(st); else { RP.use(RP.def()); RP.preset('wohnen'); } pristine = true; }
S = RP.state();
}
function save() { try { localStorage.setItem(KEY, RP.enc()); } catch (e) { } }
var lastSnap = 0;
function snap() { undo.push(RP.enc() + (pristine ? '|1' : '|0')); if (undo.length > 40) undo.shift(); lastSnap = Date.now(); var b = $('rp-undo'); if (b) b.disabled = false; }
function back() {
var s = undo.pop(); if (!s) return;
var p = s.split('|'), st = RP.dec(p[0]);
if (st) { RP.use(st); S = RP.state(); pristine = p[1] === '1'; sel = null; focusCk = null; renderAll(); commit(); }
$('rp-undo').disabled = !undo.length;
}
function byId(id) { for (var i = 0; i < S.items.length; i++) if (S.items[i].id === id) return S.items[i]; return null; }
function layout() {
var cw = host.clientWidth || 340, small = cw < 520, wide = innerWidth >= 980;
var pad = { l: small ? 30 : 42, r: small ? 8 : 14, t: small ? 30 : 36, b: small ? 8 : 14 };
var top = d.documentElement.classList.contains('bf-on') ? 112 : 76;
var maxH = wide ? clamp(innerHeight - top - 312, 280, 640) : clamp(innerHeight * 0.58, 240, 560);
K = Math.min((cw - pad.l - pad.r) / S.w, (maxH - pad.t - pad.b) / S.d);
VW = cw; VH = Math.round(S.d * K + pad.t + pad.b);
OX = pad.l + ((cw - pad.l - pad.r) - S.w * K) / 2; OY = pad.t;
T = clamp(12 * K, 5, 10); FS = small ? 11.5 : 12.5; lastW = cw;
}
function X(x) { return OX + x * K; }
function Y(y) { return OY + y * K; }
function pt(e) { var r = svg.getBoundingClientRect(), s = r.width / VW || 1; return { x: ((e.clientX - r.left) / s - OX) / K, y: ((e.clientY - r.top) / s - OY) / K }; }
var DRAW = {
sofa: function (g, w, h) {
var arm = Math.min(h * 0.24, w * 0.12), bk = h * 0.26, n = w / K >= 185 ? 3 : 2, cw = (w - 2 * arm) / n, i;
R(g, 0, 0, w, h, 6, 'd-obj'); R(g, arm, 0, w - 2 * arm, bk, 0, 'd-soft'); R(g, 0, 0, arm, h, 5, 'd-soft'); R(g, w - arm, 0, arm, h, 5, 'd-soft');
for (i = 1; i < n; i++) L(g, arm + cw * i, bk, arm + cw * i, h, 'd-line');
},
eck: function (g, w, h, it) {
var l = RP.legOf(it) * K, fx = !!it.flip, bk = l * 0.26, arm = Math.min(l * 0.24, w * 0.1);
P(g, fx ? 'M0 0H' + w + 'V' + l + 'H' + l + 'V' + h + 'H0Z' : 'M0 0H' + w + 'V' + h + 'H' + (w - l) + 'V' + l + 'H0Z', 'd-obj');
R(g, 0, 0, w, bk, 0, 'd-soft'); R(g, fx ? 0 : w - bk, 0, bk, h, 0, 'd-soft'); R(g, fx ? w - arm : 0, 0, arm, l, 4, 'd-soft');
L(g, fx ? l : w - l, bk, fx ? l : w - l, l, 'd-line');
},
sessel: function (g, w, h) { var arm = w * 0.2, bk = h * 0.28; R(g, 0, 0, w, h, 7, 'd-obj'); R(g, arm, 0, w - 2 * arm, bk, 0, 'd-soft'); R(g, 0, 0, arm, h, 5, 'd-soft'); R(g, w - arm, 0, arm, h, 5, 'd-soft'); },
hocker: function (g, w, h) { R(g, 0, 0, w, h, Math.min(w, h) * 0.32, 'd-obj'); },
tisch: function (g, w, h) { R(g, 0, 0, w, h, 4, 'd-obj'); },
rund: function (g, w, h) { E('ellipse', { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2, 'class': 'd-obj' }, g); },
ess: function (g, w, h, it) {
var ch = it.ch || RP.chairs(it), cw = 44 * K, cd = 30 * K, out = 24 * K, i;
for (i = 0; i < ch.b; i++) R(g, w * (i + 0.5) / ch.b - cw / 2, -out, cw, cd, 4, 'rp-chair');
for (i = 0; i < ch.f; i++) R(g, w * (i + 0.5) / ch.f - cw / 2, h + out - cd, cw, cd, 4, 'rp-chair');
if (ch.l) R(g, -out, h / 2 - cw / 2, cd, cw, 4, 'rp-chair');
if (ch.r) R(g, w + out - cd, h / 2 - cw / 2, cd, cw, 4, 'rp-chair');
R(g, 0, 0, w, h, 4, 'd-obj');
},
essr: function (g, w, h, it) {
var n = it.ch ? it.ch.n : RP.chairs(it).n, cw = 42 * K, cd = 28 * K, i;
for (i = 0; i < n; i++) E('rect', { x: -cw / 2, y: -(w / 2 + 22 * K), width: cw, height: cd, rx: 4, 'class': 'rp-chair', transform: 'translate(' + w / 2 + ',' + h / 2 + ') rotate(' + (360 * i / n) + ')' }, g);
E('ellipse', { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2, 'class': 'd-obj' }, g);
},
schreib: function (g, w, h) { var cw = 48 * K; R(g, w / 2 - cw / 2, h - 8 * K, cw, 44 * K, 8, 'rp-chair'); R(g, 0, 0, w, h, 3, 'd-obj'); R(g, w * 0.32, h * 0.2, w * 0.36, Math.max(2, 3 * K), 1, 'd-ink'); },
tv: function (g, w, h) { R(g, 0, 0, w, h, 3, 'd-obj'); R(g, w * 0.12, Math.max(2, h * 0.12), w * 0.76, Math.max(2.5, 4 * K), 1.2, 'd-ink'); },
kasten: function (g, w, h) { R(g, 0, 0, w, h, 3, 'd-obj'); if (h > 12) { var y = h - Math.max(2.5, h * 0.16); L(g, 2, y, w - 2, y, 'd-line rp-thin'); } },
regal: function (g, w, h) { R(g, 0, 0, w, h, 2, 'd-obj'); if (w > 14 && h > 14) R(g, 3, 3, w - 6, h - 6, 1, 'rp-inset'); },
schrank: function (g, w, h) { var n = Math.max(2, Math.round(w / K / 50)), y = h * 0.82, i; R(g, 0, 0, w, h, 2, 'd-obj'); L(g, 0, y, w, y, 'd-line rp-thin'); for (i = 1; i < n; i++) L(g, w * i / n, y, w * i / n, h, 'd-line rp-thin'); },
bett: function (g, w, h) {
var two = w / K >= 135, pad = Math.max(3, 6 * K), pw = two ? (w - 3 * pad) / 2 : w - 2 * pad, ph = Math.min(h * 0.17, 42 * K);
R(g, 0, 0, w, h, 5, 'd-obj'); R(g, 0, h * 0.3, w, h * 0.7, 5, 'd-soft'); L(g, 0, h * 0.38, w, h * 0.38, 'd-line rp-thin');
R(g, pad, h * 0.06, pw, ph, 4, 'rp-pillow'); if (two) R(g, pad * 2 + pw, h * 0.06, pw, ph, 4, 'rp-pillow');
},
teppich: function (g, w, h) { R(g, 0, 0, w, h, 3, 'd-rug'); if (w > 26 && h > 26) R(g, 5, 5, w - 10, h - 10, 2, 'rp-rugin'); },
teppichr: function (g, w, h) { E('ellipse', { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2, 'class': 'd-rug' }, g); if (w > 30) E('ellipse', { cx: w / 2, cy: h / 2, rx: w / 2 - 5, ry: h / 2 - 5, 'class': 'rp-rugin' }, g); },
pflanze: function (g, w, h) { var r = Math.min(w, h) / 2, i, a; E('circle', { cx: w / 2, cy: h / 2, r: r, 'class': 'rp-plant' }, g); for (i = 0; i < 5; i++) { a = i * 72 * Math.PI / 180 - 0.4; L(g, w / 2, h / 2, w / 2 + Math.cos(a) * r * 0.74, h / 2 + Math.sin(a) * r * 0.74, 'rp-leafs'); } },
lampe: function (g, w, h) { var r = Math.min(w, h) / 2; E('circle', { cx: w / 2, cy: h / 2, r: r, 'class': 'd-obj' }, g); E('circle', { cx: w / 2, cy: h / 2, r: r * 0.46, 'class': 'rp-glow' }, g); },
block: function (g, w, h) { R(g, 0, 0, w, h, 2, 'rp-blockbase'); E('rect', { x: 0, y: 0, width: w, height: h, rx: 2, fill: 'url(#rp-hatch)', 'class': 'rp-block' }, g); }
};
function paint(it) {
var g = els[it.id], c = CAT[it.t], w = it.w * K, h = it.h * K, W = RP.bw(it) * K, Hh = RP.bh(it) * K;
g.textContent = '';
var inner = E('g', { 'class': 'rp-in' }, g);
var sh = E('g', { transform: ['translate(0,0)', 'translate(' + h + ',0) rotate(90)', 'translate(' + w + ',' + h + ') rotate(180)', 'translate(0,' + w + ') rotate(270)'][it.r] }, inner);
DRAW[c.k](sh, w, h, it);
if (c.s) {
var tw = c.s.length * FS * 0.56, t = null;
if (tw < W - 4 && FS < Hh - 3) t = E('text', { x: W / 2, y: Hh / 2 + FS * 0.36, 'text-anchor': 'middle', 'class': 'rp-lb', 'aria-hidden': 'true' }, inner);
else if (tw < Hh - 4 && FS < W - 3) t = E('text', { x: W / 2, y: Hh / 2 + FS * 0.36, 'text-anchor': 'middle', 'class': 'rp-lb', 'aria-hidden': 'true', transform: 'rotate(-90 ' + W / 2 + ' ' + Hh / 2 + ')' }, inner);
if (t) t.textContent = c.s;
}
var px = Math.max(0, (40 - W) / 2), py = Math.max(0, (40 - Hh) / 2);
E('rect', { x: -px, y: -py, width: W + 2 * px, height: Hh + 2 * py, 'class': 'rp-hit' }, g);
var nm = c.s && !new RegExp('(^|[^A-Za-zÄÖÜäöüß])' + c.s + '([^A-Za-zÄÖÜäöüß]|$)').test(c.n) ? c.s + ': ' + c.n : c.n;
g.setAttribute('aria-label', nm + ', ' + (c.round ? it.w + ' Zentimeter Durchmesser' : it.w + ' mal ' + it.h + ' Zentimeter') + '. Pfeiltasten verschieben, R dreht, Entf entfernt.');
g.setAttribute('class', 'rp-it' + (c.flat ? ' flat' : '') + (sel && sel.k === 'it' && sel.id === it.id ? ' sel' : ''));
}
function place(it) { els[it.id].setAttribute('transform', 'translate(' + X(it.x) + ',' + Y(it.y) + ')'); }
function order() { return S.items.slice().sort(function (a, b) { return (CAT[a.t].flat ? 0 : 1) - (CAT[b.t].flat ? 0 : 1) || b.w * b.h - a.w * a.h; }); }
function wallTf(wall, pos) {
return wall === 'N' ? 'matrix(1,0,0,1,' + X(pos) + ',' + Y(0) + ')' : wall === 'S' ? 'matrix(1,0,0,-1,' + X(pos) + ',' + Y(S.d) + ')' : wall === 'W' ? 'matrix(0,1,1,0,' + X(0) + ',' + Y(pos) + ')' : 'matrix(0,1,-1,0,' + X(S.w) + ',' + Y(pos) + ')';
}
function paintDoor(g, o, i) {
var s = o.size * K, hx = o.hinge ? s : 0, ox = o.hinge ? 0 : s;
g.textContent = '';
R(g, 0, -T - 1, s, T + 2, 0, 'rp-gap'); L(g, 0, -T, 0, 0, 'rp-jamb'); L(g, s, -T, s, 0, 'rp-jamb');
if (o.inw) { P(g, 'M' + hx + ' ' + s + 'A' + s + ' ' + s + ' 0 0 ' + (o.hinge ? 1 : 0) + ' ' + ox + ' 0', 'rp-arc'); L(g, hx, 0, hx, s, 'rp-leaf'); }
else L(g, hx, -T, hx, -T - Math.min(s, 16), 'rp-leaf');
R(g, -6, -T - 12, s + 12, T + 12 + 14, 0, 'rp-hit');
g.setAttribute('aria-label', 'Tür, ' + o.size + ' Zentimeter breit, ' + RP.WALLNAME[o.wall] + '. Ziehen versetzt sie.');
g.setAttribute('transform', wallTf(o.wall, o.pos));
g.setAttribute('class', 'rp-door' + (sel && sel.k === 'door' && sel.i === i ? ' sel' : ''));
}
function paintWin(g, o, i) {
var s = o.size * K;
g.textContent = '';
R(g, 0, -T - 1, s, T + 2, 0, 'rp-gap'); R(g, 0, -T, s, T, 0, 'rp-winbox'); L(g, 0, -T / 2, s, -T / 2, 'rp-glass');
R(g, -6, -T - 12, s + 12, T + 12 + 10, 0, 'rp-hit');
g.setAttribute('aria-label', 'Fenster, ' + o.size + ' Zentimeter breit, ' + RP.WALLNAME[o.wall] + '. Ziehen versetzt es.');
g.setAttribute('transform', wallTf(o.wall, o.pos));
g.setAttribute('class', 'rp-win' + (sel && sel.k === 'win' && sel.i === i ? ' sel' : ''));
}
function dim(g, x1, y1, x2, y2, txt, cls, dash) {
var G = E('g', { 'class': 'rp-dim' + (cls ? ' ' + cls : '') }, g), len = Math.hypot(x2 - x1, y2 - y1), ux = len ? (x2 - x1) / len : 1, uy = len ? (y2 - y1) / len : 0, nx = -uy, ny = ux, t = 4;
E('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'stroke-dasharray': dash ? '5 4' : null }, G);
if (!dash) { E('line', { x1: x1 - nx * t, y1: y1 - ny * t, x2: x1 + nx * t, y2: y1 + ny * t }, G); E('line', { x1: x2 - nx * t, y1: y2 - ny * t, x2: x2 + nx * t, y2: y2 + ny * t }, G); }
if (txt != null && txt !== '') {
var tw = String(txt).length * FS * 0.58 + 8, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
if (len < tw + 8) { if (Math.abs(uy) > 0.7) mx += tw / 2 + 6; else my -= FS / 2 + 8; }
mx = clamp(mx, tw / 2 + 2, VW - tw / 2 - 2); my = clamp(my, FS / 2 + 4, VH - FS / 2 - 4);
E('rect', { x: mx - tw / 2, y: my - FS / 2 - 3, width: tw, height: FS + 6, rx: 4, 'class': 'bg' }, G);
E('text', { x: mx, y: my + FS * 0.36, 'text-anchor': 'middle' }, G).textContent = txt;
}
return G;
}
function drawRoom() {
gRoom.textContent = '';
var w = S.w * K, h = S.d * K, x0 = X(0), y0 = Y(0), a = '', b = '', i, p;
R(gRoom, x0, y0, w, h, 0, 'rp-floor');
for (i = 50; i < S.w; i += 50) { p = 'M' + (x0 + i * K).toFixed(1) + ' ' + y0 + 'v' + h; if (i % 100) a += p; else b += p; }
for (i = 50; i < S.d; i += 50) { p = 'M' + x0 + ' ' + (y0 + i * K).toFixed(1) + 'h' + w; if (i % 100) a += p; else b += p; }
if (a) P(gRoom, a, 'rp-grid'); if (b) P(gRoom, b, 'rp-grid m');
E('rect', { x: x0 - T / 2, y: y0 - T / 2, width: w + T, height: h + T, 'class': 'rp-wall', 'stroke-width': T }, gRoom);
dim(gRoom, x0, y0 - T - 12, x0 + w, y0 - T - 12, RP.fz(S.w / 100, 2) + ' m', 'out');
var gv = dim(gRoom, x0 - T - 12, y0, x0 - T - 12, y0 + h, '', 'out'), tw = 5 * FS * 0.58 + 8, cx = x0 - T - 12, cy = y0 + h / 2;
var gt = E('g', { transform: 'rotate(-90 ' + cx + ' ' + cy + ')' }, gv);
E('rect', { x: cx - tw / 2, y: cy - FS / 2 - 3, width: tw, height: FS + 6, rx: 4, 'class': 'bg' }, gt);
E('text', { x: cx, y: cy + FS * 0.36, 'text-anchor': 'middle' }, gt).textContent = RP.fz(S.d / 100, 2) + ' m';
}
function renderAll() {
var had = d.activeElement && svg && svg.contains(d.activeElement) ? d.activeElement.getAttribute('data-id') : null;
layout();
host.textContent = ''; els = {}; doorEls = []; winEls = [];
svg = E('svg', { viewBox: '0 0 ' + VW + ' ' + VH, width: VW, height: VH, 'class': 'rp-svg', role: 'group', 'aria-label': 'Grundriss, ' + RP.fz(S.w / 100, 2) + ' mal ' + RP.fz(S.d / 100, 2) + ' Meter. Möbel lassen sich ziehen oder mit den Pfeiltasten verschieben.' }, host);
var defs = E('defs', {}, svg), pat = E('pattern', { id: 'rp-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
E('line', { x1: 0, y1: 0, x2: 0, y2: 7, 'class': 'rp-hl' }, pat);
gRoom = E('g', {}, svg); drawRoom();
gItems = E('g', {}, svg);
order().forEach(function (it) { els[it.id] = E('g', { 'data-id': it.id, tabindex: 0, role: 'button' }, gItems); paint(it); place(it); });
gOpen = E('g', {}, svg);
S.wins.forEach(function (o, i) { var g = E('g', { 'data-i': i, tabindex: 0, role: 'button' }, gOpen); winEls.push(g); paintWin(g, o, i); });
S.doors.forEach(function (o, i) { var g = E('g', { 'data-i': i, tabindex: 0, role: 'button' }, gOpen); doorEls.push(g); paintDoor(g, o, i); });
gOver = E('g', { 'pointer-events': 'none' }, svg);
svg.addEventListener('pointerdown', onDown);
svg.addEventListener('keydown', onKey);
svg.addEventListener('focusin', onFocus);
svg.addEventListener('touchstart', function (e) { if (e.target.closest && e.target.closest('.rp-it,.rp-door,.rp-win')) e.preventDefault(); }, { passive: false });
svg.addEventListener('touchmove', function (e) { if (drag) e.preventDefault(); }, { passive: false });
if (had && els[had]) try { els[had].focus({ preventScroll: true }); } catch (e) { }
syncInputs();
}
function overlays() {
if (!gOver) return;
gOver.textContent = '';
CK.forEach(function (c) {
var on = c.st === 'warn' || c.st === 'bad' || focusCk === c.k; if (!on) return;
var cls = c.st === 'warn' || c.st === 'bad' ? 'warn' : '';
(c.dims || []).forEach(function (q) { dim(gOver, X(q.x1), Y(q.y1), X(q.x2), Y(q.y2), typeof q.l === 'number' ? q.l + ' cm' : q.l, cls, q.dash); });
if (c.circle) { E('circle', { cx: X(c.circle.x), cy: Y(c.circle.y), r: Math.max(7, c.circle.r * K), 'class': 'rp-pinch' }, gOver); dim(gOver, X(c.circle.x), Y(c.circle.y) - Math.max(7, c.circle.r * K) - FS, X(c.circle.x), Y(c.circle.y) - Math.max(7, c.circle.r * K) - FS, c.circle.l, 'warn nol'); }
if (c.door != null && S.doors[c.door]) { var b = RP.swing(S.doors[c.door]); R(gOver, X(b.x), Y(b.y), b.w * K, b.h * K, 0, 'rp-swing'); }
});
if (drag && drag.k === 'it') { if (drag.gx != null) L(gOver, X(drag.gx), Y(0), X(drag.gx), Y(S.d), 'rp-guide'); if (drag.gy != null) L(gOver, X(0), Y(drag.gy), X(S.w), Y(drag.gy), 'rp-guide'); }
if (sel && sel.k === 'it') {
var it = byId(sel.id); if (!it) return;
var b = RP.box(it), x = X(b.x), y = Y(b.y), w = b.w * K, h = b.h * K;
R(gOver, x - 3, y - 3, w + 6, h + 6, 5, 'rp-selbox');
if (!CAT[it.t].flat) ['N', 'E', 'S', 'W'].forEach(function (dr) {
var g = RP.gap(b, dr, function (o) { return o === it; }); if (g.d < 8) return;
var v = RP.VEC[dr], sx = dr === 'W' ? x : dr === 'E' ? x + w : x + w / 2, sy = dr === 'N' ? y : dr === 'S' ? y + h : y + h / 2;
dim(gOver, sx, sy, sx + v[0] * g.d * K, sy + v[1] * g.d * K, g.d, 'gap');
});
}
}
function marks() {
var bad = {};
CK.forEach(function (c) { if (c.st === 'bad' && (c.k === 'ov' || c.door != null)) (c.ids || []).forEach(function (id) { bad[id] = 1; }); });
S.items.forEach(function (it) { if (els[it.id]) els[it.id].classList.toggle('bad', !!bad[it.id]); });
}
function select(s, keepCk) {
sel = s; if (!keepCk) focusCk = null;
S.items.forEach(function (it) { if (els[it.id]) els[it.id].classList.toggle('sel', !!s && s.k === 'it' && s.id === it.id); });
doorEls.forEach(function (g, i) { g.classList.toggle('sel', !!s && s.k === 'door' && s.i === i); });
winEls.forEach(function (g, i) { g.classList.toggle('sel', !!s && s.k === 'win' && s.i === i); });
renderTool(); overlays(); if (!keepCk) pressed();
}
function snapPos(it, nx, ny) {
var w = RP.bw(it), h = RP.bh(it), tol = Math.max(4, 7 / K), c = CAT[it.t], bx = null, by = null, bk = RP.BK[it.r], g = c.k === 'sofa' || c.k === 'eck' ? 5 : 0;
nx = clamp(nx, 0, S.w - w); ny = clamp(ny, 0, S.d - h);
function cx(v, gl) { var dd = Math.abs(nx - v); if (dd <= tol && (!bx || dd < bx.d)) bx = { d: dd, v: v, g: gl }; }
function cy(v, gl) { var dd = Math.abs(ny - v); if (dd <= tol && (!by || dd < by.d)) by = { d: dd, v: v, g: gl }; }
cx(bk === 'W' ? g : 0); cx(S.w - w - (bk === 'E' ? g : 0)); cy(bk === 'N' ? g : 0); cy(S.d - h - (bk === 'S' ? g : 0));
S.items.forEach(function (o) {
if (o === it) return;
var b = RP.box(o), ovY = ny < b.y + b.h && ny + h > b.y, ovX = nx < b.x + b.w && nx + w > b.x;
if (c.flat || CAT[o.t].flat) { if (c.flat !== !!CAT[o.t].flat) { if (ovY || ovX) { cx(b.x + b.w / 2 - w / 2, b.x + b.w / 2); cy(b.y + b.h / 2 - h / 2, b.y + b.h / 2); } } return; }
if (ovY) { cx(b.x + b.w); cx(b.x - w); }
if (ovX) { cy(b.y + b.h); cy(b.y - h); }
if (ovX) { cx(b.x, b.x); cx(b.x + b.w - w, b.x + b.w); cx(b.x + b.w / 2 - w / 2, b.x + b.w / 2); }
if (ovY) { cy(b.y, b.y); cy(b.y + b.h - h, b.y + b.h); cy(b.y + b.h / 2 - h / 2, b.y + b.h / 2); }
});
nx = bx ? bx.v : Math.round(nx / 5) * 5; ny = by ? by.v : Math.round(ny / 5) * 5;
return { x: Math.round(clamp(nx, 0, S.w - w)), y: Math.round(clamp(ny, 0, S.d - h)), gx: bx && bx.g != null ? bx.g : null, gy: by && by.g != null ? by.g : null };
}
function onDown(e) {
if (e.button) return;
var t = e.target.closest ? e.target.closest('.rp-it,.rp-door,.rp-win') : null;
if (!t) { if (sel) select(null); return; }
if (e.pointerType === 'mouse') e.preventDefault();
try { t.focus({ preventScroll: true }); } catch (x) { }
var p = pt(e);
if (t.classList.contains('rp-it')) {
var it = byId(+t.getAttribute('data-id')); if (!it) return;
select({ k: 'it', id: it.id });
drag = { k: 'it', it: it, dx: p.x - it.x, dy: p.y - it.y, x0: it.x, y0: it.y, moved: false, pid: e.pointerId };
} else {
var k = t.classList.contains('rp-door') ? 'door' : 'win', i = +t.getAttribute('data-i'), o = (k === 'door' ? S.doors : S.wins)[i]; if (!o) return;
select({ k: k, i: i });
var along = o.wall === 'N' || o.wall === 'S' ? p.x : p.y;
drag = { k: k, o: o, i: i, el: t, off: clamp(along - o.pos, 0, o.size), px: p.x, py: p.y, moved: false, pid: e.pointerId };
}
addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
}
var raf = 0, lastCk = 0;
function liveSoon() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var now = Date.now(); if (now - lastCk > 140) { lastCk = now; CK = RP.check(); marks(); renderChecks(); } overlays(); }); }
function onMove(e) {
if (!drag || e.pointerId !== drag.pid) return;
var p = pt(e);
if (drag.k === 'it') {
var it = drag.it, nx = p.x - drag.dx, ny = p.y - drag.dy;
if (!drag.moved) { if (Math.hypot(nx - drag.x0, ny - drag.y0) * K < 4) return; drag.moved = true; snap(); pristine = false; root.classList.add('rp-drag'); }
var q = snapPos(it, nx, ny);
if (q.x !== it.x || q.y !== it.y || q.gx !== drag.gx || q.gy !== drag.gy) { it.x = q.x; it.y = q.y; drag.gx = q.gx; drag.gy = q.gy; place(it); liveSoon(); }
} else {
if (!drag.moved) { if (Math.hypot(p.x - drag.px, p.y - drag.py) * K < 4) return; drag.moved = true; snap(); root.classList.add('rp-drag'); }
var o = drag.o, dist = { N: Math.abs(p.y), S: Math.abs(S.d - p.y), W: Math.abs(p.x), E: Math.abs(S.w - p.x) }, wall = o.wall, k;
for (k in dist) if (dist[k] < dist[wall] - 15) wall = k;
var len = RP.wallLen(wall), size = Math.min(o.size, len), along = wall === 'N' || wall === 'S' ? p.x : p.y, pos = clamp(Math.round((along - (wall === o.wall ? drag.off : size / 2)) / 5) * 5, 0, len - size);
if (wall !== o.wall || pos !== o.pos) { o.wall = wall; o.pos = pos; o.size = size; drag.el.setAttribute('transform', wallTf(wall, pos)); liveSoon(); }
}
}
function onUp(e) {
if (!drag || (e && e.pointerId !== drag.pid)) return;
removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
var dg = drag; drag = null; root.classList.remove('rp-drag');
if (!dg.moved) { var tr = $('rp-tool').getBoundingClientRect(); if (tr.top > innerHeight - 110) scrollBy({ top: Math.min(tr.top - innerHeight + 230, tr.height + 20), behavior: RM ? 'auto' : 'smooth' }); return; }
if (dg.k !== 'it' && pristine) { relayout(); return; }
if (dg.k !== 'it') { renderAll(); }
commit();
}
function onFocus(e) {
var t = e.target.closest ? e.target.closest('.rp-it,.rp-door,.rp-win') : null; if (!t || drag) return;
if (t.classList.contains('rp-it')) { var id = +t.getAttribute('data-id'); if (!sel || sel.k !== 'it' || sel.id !== id) select({ k: 'it', id: id }); }
else { var k = t.classList.contains('rp-door') ? 'door' : 'win', i = +t.getAttribute('data-i'); if (!sel || sel.k !== k || sel.i !== i) select({ k: k, i: i }); }
}
function onKey(e) {
var t = e.target.closest ? e.target.closest('.rp-it,.rp-door,.rp-win') : null; if (!t) return;
var key = e.key, step = e.shiftKey ? 1 : 5, v = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key];
if (key === 'Escape') { select(null); t.blur(); return; }
if (t.classList.contains('rp-it')) {
var it = byId(+t.getAttribute('data-id')); if (!it) return;
if (v) { e.preventDefault(); nudge(it, v[0] * step, v[1] * step); }
else if (key === 'r' || key === 'R') { e.preventDefault(); rotate(it); }
else if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); removeItem(it); }
} else if (v) {
e.preventDefault();
var k = t.classList.contains('rp-door') ? 'door' : 'win', i = +t.getAttribute('data-i'), o = (k === 'door' ? S.doors : S.wins)[i], horiz = o.wall === 'N' || o.wall === 'S', dd = horiz ? v[0] : v[1]; if (!dd) return;
if (Date.now() - lastSnap > 900) snap();
o.pos = clamp(o.pos + dd * step, 0, RP.wallLen(o.wall) - o.size); t.setAttribute('transform', wallTf(o.wall, o.pos)); commitSoon();
}
}
var ct = 0;
function commitSoon() { clearTimeout(ct); ct = setTimeout(function () { if (pristine && sel && sel.k !== 'it') relayout(true); else commit(); }, 350); CK = RP.check(); marks(); overlays(); }
function nudge(it, dx, dy) { if (Date.now() - lastSnap > 900) snap(); pristine = false; it.x += dx; it.y += dy; RP.fit(it); place(it); CK = RP.check(); marks(); overlays(); clearTimeout(ct); ct = setTimeout(commit, 350); }
function rotate(it) {
snap(); pristine = false;
var c = RP.ctr(it); it.r = (it.r + 1) % 4; it.x = Math.round(c.x - RP.bw(it) / 2); it.y = Math.round(c.y - RP.bh(it) / 2); RP.fit(it);
paint(it); place(it); commit(); renderTool();
}
function resize(it, w, h) {
var c = CAT[it.t]; w = Math.round(RP.lim(w, RP.LIM.item[0], Math.min(RP.LIM.item[1], Math.max(S.w, S.d)))); h = Math.round(RP.lim(h, RP.LIM.item[0], Math.min(RP.LIM.item[1], Math.max(S.w, S.d))));
if (!(w > 0) || !(h > 0)) { renderTool(); return; }
if (c.round) h = w;
if (w === it.w && h === it.h) { renderTool(); return; }
snap(); pristine = false;
var a = RP.abs(it, it.w / 2, 0); it.w = w; it.h = h; var b = RP.abs(it, it.w / 2, 0); it.x = Math.round(it.x + a[0] - b[0]); it.y = Math.round(it.y + a[1] - b[1]); RP.fit(it);
paint(it); place(it); commit(); renderTool();
}
function removeItem(it) { snap(); pristine = false; var k = S.items.indexOf(it); if (k >= 0) S.items.splice(k, 1); sel = null; renderAll(); commit(); renderTool(); }
function addItem(t, from) {
if (S.items.length >= RP.LIM.items) { toast('Mehr als ' + RP.LIM.items + ' Möbel passen nicht in den Plan.'); return; }
snap(); pristine = false;
var c = CAT[t], it = { id: RP.newId(), t: t, w: from ? from.w : Math.min(c.w, S.w), h: from ? from.h : Math.min(c.h, Math.max(S.w, S.d)), r: from ? from.r : 0, x: 0, y: 0 };
if (from && from.flip) it.flip = 1;
if (RP.bw(it) > S.w || RP.bh(it) > S.d) { it.r = 1; if (RP.bw(it) > S.w || RP.bh(it) > S.d) { it.r = 0; it.w = Math.min(it.w, S.w); it.h = Math.min(it.h, S.d); } }
if (from) { it.x = from.x + 20; it.y = from.y + 20; RP.fit(it); if (!RP.valid(it)) RP.spot(it); } else RP.spot(it);
S.items.push(it); sel = { k: 'it', id: it.id }; renderAll(); commit(); renderTool();
var r = host.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) host.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
toast(c.n + ' steht im Plan. Zieh ' + ({ m: 'ihn', n: 'es', f: 'sie' }[c.a]) + ' an den richtigen Platz.');
}
function clampAll() {
S.doors.concat(S.wins).forEach(function (o) { var len = RP.wallLen(o.wall); o.size = Math.min(o.size, len); o.pos = clamp(o.pos, 0, len - o.size); });
S.items.forEach(function (it) { if (RP.bw(it) > S.w || RP.bh(it) > S.d) { if (RP.bh(it) <= S.w && RP.bw(it) <= S.d) it.r = (it.r + 1) % 4; else { it.w = Math.min(it.w, it.r % 2 ? S.d : S.w); it.h = Math.min(it.h, it.r % 2 ? S.w : S.d); } } RP.fit(it); });
}
function relayout(quiet) { RP.preset(S.type); pristine = true; sel = null; focusCk = null; renderAll(); commit(); renderTool(); if (!quiet) pulse(); }
function setRoom(w, dd) {
w = Math.round(RP.lim(w, RP.LIM.room[0], RP.LIM.room[1])); dd = Math.round(RP.lim(dd, RP.LIM.room[0], RP.LIM.room[1]));
if (!(w > 0) || !(dd > 0) || (w === S.w && dd === S.d)) { syncInputs(true); return; }
snap(); S.w = w; S.d = dd; clampAll();
if (pristine) relayout(true); else { renderAll(); commit(); }
}
function addOpening(kind) {
var arr = kind === 'door' ? S.doors : S.wins, max = kind === 'door' ? RP.LIM.doors : RP.LIM.wins, size = kind === 'door' ? 90 : 120;
if (arr.length >= max) { toast(kind === 'door' ? 'Mehr Türen passen nicht in den Plan.' : 'Mehr Fenster passen nicht in den Plan.'); return; }
var best = null;
['N', 'E', 'S', 'W'].forEach(function (wl) {
var len = RP.wallLen(wl); if (len < size) return;
var used = S.doors.concat(S.wins).filter(function (o) { return o.wall === wl; }), free = [[0, len]];
used.forEach(function (o) { var nf = []; free.forEach(function (f) { if (o.pos > f[0]) nf.push([f[0], Math.min(f[1], o.pos - 10)]); if (o.pos + o.size < f[1]) nf.push([Math.max(f[0], o.pos + o.size + 10), f[1]]); }); free = nf.filter(function (f) { return f[1] - f[0] > 0; }); });
free.forEach(function (f) { var l = f[1] - f[0]; if (l >= size && (!best || l - used.length * 200 > best.s)) best = { s: l - used.length * 200, wl: wl, pos: Math.round((f[0] + (l - size) / 2) / 5) * 5 }; });
});
if (!best) { toast('An den Wänden ist kein Platz mehr frei.'); return; }
snap();
arr.push(kind === 'door' ? { wall: best.wl, pos: best.pos, size: size, hinge: 0, inw: 1 } : { wall: best.wl, pos: best.pos, size: size });
sel = { k: kind === 'door' ? 'door' : 'win', i: arr.length - 1 };
if (pristine) { RP.preset(S.type); }
renderAll(); commit(); renderTool();
}
function pulse() { if (RM) return; root.classList.remove('rp-pulse'); void root.offsetWidth; root.classList.add('rp-pulse'); setTimeout(function () { root.classList.remove('rp-pulse'); }, 700); }
function syncInputs(force) {
var w = $('rp-w'), dd = $('rp-d');
if (w && (force || d.activeElement !== w)) w.value = S.w;
if (dd && (force || d.activeElement !== dd)) dd.value = S.d;
var a = $('rp-area'); if (a) a.textContent = RP.fz(S.w / 100, 2) + ' × ' + RP.fz(S.d / 100, 2) + ' m, das sind ' + RP.fz(S.w * S.d / 1e4, 1) + ' m².';
var tb = $('rp-type'); if (tb) [].forEach.call(tb.children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === S.type); });
var n = $('rp-tb-n'), m = $('rp-tb-m'), f = $('rp-tb-a');
if (n) n.textContent = RP.TYPES[S.type]; if (m) m.textContent = RP.fz(S.w / 100, 2) + ' × ' + RP.fz(S.d / 100, 2) + ' m'; if (f) f.textContent = RP.fz(S.w * S.d / 1e4, 1) + ' m²';
}
function fld(id, lab, val) { return '<label>' + lab + ' <span class="vbox"><input class="vin" id="' + id + '" type="text" inputmode="numeric" autocomplete="off" value="' + val + '" aria-label="' + lab + ' in Zentimetern"><span class="vu">cm</span></span></label>'; }
function act(a, txt, pressed) { return '<button type="button" data-a="' + a + '"' + (pressed != null ? ' aria-pressed="' + pressed + '"' : '') + '>' + (IC[a] || '') + '<span>' + txt + '</span></button>'; }
function renderTool() {
var box = $('rp-tool'), h = '', s = sel;
if (!s || (s.k === 'it' && !byId(s.id)) || (s.k === 'door' && !S.doors[s.i]) || (s.k === 'win' && !S.wins[s.i])) {
box.className = 'rp-tool empty'; box.innerHTML = '<p>Tipp ein Möbel an, um es zu drehen oder seine Maße zu ändern. Ein Kästchen im Raster ist 50&nbsp;cm breit.</p>'; return;
}
box.className = 'rp-tool';
var head = function (t) { return '<div class="rp-tl-h"><b>' + t + '</b><button type="button" class="rp-x" data-a="close" aria-label="Auswahl aufheben">' + IC.x + '</button></div>'; };
if (s.k === 'it') {
var it = byId(s.id), c = CAT[it.t];
h = head(c.n) + '<div class="rp-tl-s">' + fld('rp-iw', c.round ? 'Durchmesser' : 'Breite', it.w) + (c.round ? '' : fld('rp-ih', 'Tiefe', it.h)) + '</div>'
+ (c.sz ? '<div class="opts rp-sz" role="group" aria-label="Gängige Größen in Zentimetern">' + c.sz.map(function (q) { return '<button type="button" data-sz="' + q[0] + 'x' + q[1] + '" aria-pressed="' + (q[0] === it.w && q[1] === it.h) + '">' + (c.round ? q[0] : q[0] + ' × ' + q[1]) + '</button>'; }).join('') + '</div>' : '')
+ '<div class="rp-acts">' + act('rot', 'Drehen') + (c.k === 'eck' ? act('flip', 'Spiegeln') : '') + act('dup', 'Doppeln') + act('del', 'Entfernen') + '</div>'
+ '<div class="rp-nudge" role="group" aria-label="In Schritten von 5 Zentimetern verschieben"><button type="button" data-n="0,-5" aria-label="5 cm nach oben">↑</button><button type="button" data-n="-5,0" aria-label="5 cm nach links">←</button><button type="button" data-n="0,5" aria-label="5 cm nach unten">↓</button><button type="button" data-n="5,0" aria-label="5 cm nach rechts">→</button><span>Feinschritte: 5 cm</span></div>';
} else if (s.k === 'door') {
var o = S.doors[s.i];
h = head('Tür') + '<div class="rp-tl-s">' + fld('rp-ow', 'Breite', o.size) + '</div><div class="rp-acts">' + act('hinge', 'Anschlag wechseln') + act('inw', o.inw ? 'Öffnet in den Raum' : 'Öffnet nach außen', !!o.inw) + act('del', 'Entfernen') + '</div>';
} else {
h = head('Fenster') + '<div class="rp-tl-s">' + fld('rp-ow', 'Breite', S.wins[s.i].size) + '</div><div class="rp-acts">' + act('del', 'Entfernen') + '</div>';
}
box.innerHTML = h;
}
function onTool(e) {
var b = e.target.closest('button'); if (!b || !sel) return;
var a = b.getAttribute('data-a'), it = sel.k === 'it' ? byId(sel.id) : null, o = sel.k === 'door' ? S.doors[sel.i] : sel.k === 'win' ? S.wins[sel.i] : null;
if (a === 'close') { select(null); return; }
if (it) {
if (b.hasAttribute('data-n')) { var v = b.getAttribute('data-n').split(','); nudge(it, +v[0], +v[1]); return; }
if (b.hasAttribute('data-sz')) { var q = b.getAttribute('data-sz').split('x'); resize(it, +q[0], +q[1]); return; }
if (a === 'rot') rotate(it); else if (a === 'flip') { snap(); pristine = false; it.flip = it.flip ? 0 : 1; paint(it); commit(); }
else if (a === 'dup') addItem(it.t, it); else if (a === 'del') removeItem(it);
} else if (o) {
if (a === 'del') { snap(); (sel.k === 'door' ? S.doors : S.wins).splice(sel.i, 1); sel = null; if (pristine) RP.preset(S.type); renderAll(); commit(); renderTool(); return; }
snap(); if (a === 'hinge') o.hinge = o.hinge ? 0 : 1; else if (a === 'inw') o.inw = o.inw ? 0 : 1;
if (pristine) RP.preset(S.type);
renderAll(); commit(); renderTool();
}
}
function onToolChange(e) {
var t = e.target; if (!t.classList || !t.classList.contains('vin') || !sel) return;
var v = num(t.value);
if (sel.k === 'it') { var it = byId(sel.id); if (!it) return; if (t.id === 'rp-iw') resize(it, v, CAT[it.t].round ? v : it.h); else resize(it, it.w, v); }
else {
var o = sel.k === 'door' ? S.doors[sel.i] : S.wins[sel.i], L2 = sel.k === 'door' ? RP.LIM.door : RP.LIM.win, len = RP.wallLen(o.wall);
v = Math.round(RP.lim(v, L2[0], Math.min(L2[1], len))); if (!(v > 0) || v === o.size) { renderTool(); return; }
snap(); o.size = v; o.pos = clamp(o.pos, 0, len - v); if (pristine) RP.preset(S.type); renderAll(); commit(); renderTool();
}
}
function icon(t) {
var c = CAT[t], bw = 46, bh = 36, k = Math.min((bw - 6) / c.w, (bh - 6) / c.h, 0.26), w = c.w * k, h = c.h * k, k0 = K;
var sv = E('svg', { viewBox: '0 0 ' + bw + ' ' + bh, width: bw, height: bh, 'class': 'rp-ico', 'aria-hidden': 'true' }), g = E('g', { transform: 'translate(' + ((bw - w) / 2).toFixed(1) + ',' + ((bh - h) / 2).toFixed(1) + ')' }, sv);
K = k; try { DRAW[c.k](g, w, h, { t: t, w: c.w, h: c.h, r: 0, x: 0, y: 0, ch: c.k === 'ess' ? { b: 2, f: 2, l: 0, r: 0, n: 4 } : { n: 4 } }); } finally { K = k0; }
return sv.outerHTML;
}
function renderCat() {
var tabs = $('rp-tabs'), box = $('rp-cat');
tabs.innerHTML = RP.GROUPS.map(function (g, i) { return '<button type="button" data-g="' + i + '" aria-pressed="' + (i === group) + '">' + g + '</button>'; }).join('');
box.innerHTML = Object.keys(CAT).filter(function (t) { return CAT[t].g === group; }).map(function (t) { var c = CAT[t]; return '<button type="button" data-t="' + t + '">' + icon(t) + '<b>' + c.n + '</b><small>' + (c.round ? 'Ø ' + c.w : c.w + ' × ' + c.h) + '<span class="sr"> Zentimeter, hinzufügen</span></small></button>'; }).join('');
}
var MARK = { ok: '✓', warn: '!', bad: '×', info: 'i' }, WORD = { ok: 'Passt', warn: 'Knapp', bad: 'Problem', info: 'Hinweis' }, ORD = { bad: 0, warn: 1, info: 2, ok: 3 };
function pressed() { var ul = $('rp-checks'); if (ul) [].forEach.call(ul.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-k') === focusCk); }); }
function renderChecks() {
var ul = $('rp-checks'), n = { ok: 0, warn: 0, bad: 0, info: 0 }, h = '';
CK.slice().sort(function (a, b) { return ORD[a.st] - ORD[b.st]; }).forEach(function (c) {
n[c.st]++;
h += '<li class="rp-ck ' + c.st + '"><button type="button" data-k="' + c.k + '" aria-pressed="' + (focusCk === c.k) + '"><span class="rp-st" aria-hidden="true">' + MARK[c.st] + '</span><span class="rp-ct"><b><span class="sr">' + WORD[c.st] + ': </span>' + c.t + '</b><span>' + c.x + '</span></span></button></li>';
});
if (ul.__h !== h) { ul.innerHTML = h; ul.__h = h; }
var tot = S.items.some(function (i) { return !CAT[i.t].flat; }) ? n.ok + n.warn + n.bad : 0, iss = tot ? n.warn + n.bad : 0, sum = $('rp-sum'), txt = !tot ? 'Stell Möbel in den Raum, dann prüfen wir die Abstände.' : iss ? iss + ' von ' + tot + ' Punkten ' + (iss === 1 ? 'passt' : 'passen') + ' noch nicht.' : 'Alles passt: ' + tot + ' ' + (tot === 1 ? 'Punkt' : 'Punkte') + ' geprüft.';
if (sum.textContent !== txt) sum.textContent = txt;
sum.className = 'rp-sum ' + (iss ? (n.bad ? 'bad' : 'warn') : 'ok');
var pill = $('rp-stat');
if (pill) {
var cls = 'rp-stat ' + (!tot ? 'none' : iss ? (n.bad ? 'bad' : 'bad warn') : 'ok'), ph = !tot ? '' : iss ? '<i aria-hidden="true">!</i>' + iss + ' offen' : '<i aria-hidden="true">✓</i>Alles passt';
if (pill.__h !== ph) { pill.innerHTML = ph; pill.__h = ph; }
pill.className = cls; pill.setAttribute('aria-label', (iss ? iss + ' offen' : 'Alles passt') + ' im Raum-Check. Zur Liste springen.');
}
}
function renderList() {
var box = $('rp-list'), items = RP.shop(CK), h = '';
items.forEach(function (s) { h += '<a class="item" href="https://www.amazon.de/s?k=' + encodeURIComponent(s.q).replace(/%20/g, '+') + '&tag=' + TAG + '" rel="sponsored nofollow noopener" target="_blank"><div><b>' + s.t + '</b><span>' + s.x + '</span></div><span class="go"><span>Bei Amazon' + EXT + '</span><small>Anzeige</small></span></a>'; });
if (box.__h !== h) { box.innerHTML = h; box.__h = h; }
var wrap = $('rp-list-wrap'); if (wrap) wrap.hidden = !items.length;
var tb = $('rp-tab'); if (!tb) return;
var rows = order().reverse().map(function (it) { var c = CAT[it.t]; return '<tr><td>' + c.n + '</td><td>' + (c.round ? 'Ø ' + it.w : it.w + ' × ' + it.h) + ' cm</td><td>' + it.x + ' cm</td><td>' + it.y + ' cm</td></tr>'; }).join('');
tb.innerHTML = '<thead><tr><th>Möbel</th><th>Breite × Tiefe</th><th>Abstand zur linken Wand</th><th>Abstand zur oberen Wand</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Noch keine Möbel im Plan.</td></tr>') + '</tbody>';
}
function commit() {
CK = RP.check();
if (!drag) S.items.forEach(function (it) { var k = CAT[it.t].k; if ((k === 'ess' || k === 'essr') && els[it.id]) paint(it); });
marks(); overlays(); renderChecks(); renderList(); syncInputs(); save();
}
function shareUrl() { return location.origin + location.pathname + '?p=' + RP.enc() + '#planer'; }
function share() {
var url = shareUrl(), text = 'Mein Raumplan: ' + RP.TYPES[S.type] + ', ' + RP.fz(S.w / 100, 2) + ' × ' + RP.fz(S.d / 100, 2) + ' m';
function copy() { var ok = function () { toast('Link zum Plan kopiert'); }, no = function () { toast('Kopieren nicht möglich'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, no); else no(); }
if (navigator.share) { navigator.share({ title: 'Raumplan', text: text, url: url }).catch(function (err) { if (!err || err.name !== 'AbortError') copy(); }); return; }
copy();
}
function picture() {
select(null);
try {
var clone = svg.cloneNode(true), src = svg.querySelectorAll('*'), dst = clone.querySelectorAll('*'), props = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'font-size', 'font-weight', 'text-anchor'], i;
for (i = 0; i < src.length; i++) { if (src[i].tagName === 'defs' || src[i].closest('defs')) continue; var cs = getComputedStyle(src[i]), st = ''; props.forEach(function (p) { st += p + ':' + cs.getPropertyValue(p) + ';'; }); dst[i].setAttribute('style', st + 'font-family:Helvetica,Arial,sans-serif'); }
[].forEach.call(clone.querySelectorAll('.rp-hit'), function (n) { n.remove(); });
var css = getComputedStyle(root), bg = css.getPropertyValue('--sheet').trim() || '#fbfbf8', ink = css.getPropertyValue('--ink').trim() || '#1c1f1d', mut = css.getPropertyValue('--mut').trim() || '#5c605d', line = css.getPropertyValue('--line').trim() || '#d9d8d1';
var hl = clone.querySelector('.rp-hl'); if (hl) hl.setAttribute('style', 'stroke:' + mut + ';stroke-width:1.2');
var foot = 46, Hh = VH + foot, out = d.createElementNS(NS, 'svg');
out.setAttribute('xmlns', NS); out.setAttribute('viewBox', '0 0 ' + VW + ' ' + Hh); out.setAttribute('width', VW); out.setAttribute('height', Hh);
E('rect', { x: 0, y: 0, width: VW, height: Hh, fill: bg }, out);
clone.removeAttribute('class'); clone.setAttribute('x', 0); clone.setAttribute('y', 0); out.appendChild(clone);
E('line', { x1: 0, y1: VH + 0.5, x2: VW, y2: VH + 0.5, stroke: line }, out);
var t1 = E('text', { x: 12, y: VH + 28, fill: ink, 'font-family': 'Helvetica,Arial,sans-serif', 'font-size': 14, 'font-weight': 700 }, out); t1.textContent = RP.TYPES[S.type] + '  ' + RP.fz(S.w / 100, 2) + ' × ' + RP.fz(S.d / 100, 2) + ' m  (' + RP.fz(S.w * S.d / 1e4, 1) + ' m²)';
var t2 = E('text', { x: VW - 12, y: VH + 28, fill: mut, 'font-family': 'Helvetica,Arial,sans-serif', 'font-size': 12, 'text-anchor': 'end' }, out); t2.textContent = 'stil-daheim.de/raumplaner';
var xml = new XMLSerializer().serializeToString(out), img = new Image(), sc = Math.max(2, Math.min(4, 1600 / VW));
img.onload = function () {
try {
var cv = d.createElement('canvas'); cv.width = Math.round(VW * sc); cv.height = Math.round(Hh * sc); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
cv.toBlob(function (blob) {
if (!blob) return fail();
var file = null; try { file = new File([blob], 'raumplan.png', { type: 'image/png' }); } catch (x) { }
if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Raumplan' }).catch(function (err) { if (!err || err.name !== 'AbortError') down(blob); }); return; }
down(blob);
}, 'image/png');
} catch (x) { fail(); }
};
img.onerror = fail;
img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
} catch (x) { fail(); }
function down(blob) { var a = d.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = 'raumplan.png'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast('Bild gespeichert'); }
function fail() { toast('Das Bild klappt in diesem Browser nicht. Nimm Drucken oder einen Screenshot.'); }
}
load();
var tb = $('rp-type');
tb.innerHTML = Object.keys(RP.TYPES).map(function (t) { return '<button type="button" data-t="' + t + '" aria-pressed="false">' + RP.TYPES[t] + '</button>'; }).join('');
tb.addEventListener('click', function (e) {
var b = e.target.closest('button'); if (!b) return;
var custom = !pristine && S.items.length > 0;
snap(); S.type = b.getAttribute('data-t'); relayout();
if (custom) toast('Neu eingerichtet. „Rückgängig“ holt deinen Plan zurück.');
});
['rp-w', 'rp-d'].forEach(function (id) {
var el = $(id);
el.addEventListener('change', function () { var v = num(el.value); if (v > 0 && v < 20) v *= 100; if (id === 'rp-w') setRoom(v, S.d); else setRoom(S.w, v); });
el.addEventListener('keydown', function (e) { if (e.key === 'Enter') el.blur(); });
});
$('rp-undo').addEventListener('click', back);
$('rp-again').addEventListener('click', function () { var custom = !pristine && S.items.length > 0; snap(); relayout(); if (custom) toast('Neu eingerichtet. „Rückgängig“ holt deinen Plan zurück.'); });
$('rp-adddoor').addEventListener('click', function () { addOpening('door'); });
$('rp-addwin').addEventListener('click', function () { addOpening('win'); });
$('rp-tool').addEventListener('click', onTool);
$('rp-tool').addEventListener('change', onToolChange);
$('rp-tool').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('vin')) e.target.blur(); });
$('rp-tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; group = +b.getAttribute('data-g'); renderCat(); });
$('rp-cat').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) addItem(b.getAttribute('data-t')); });
$('rp-checks').addEventListener('click', function (e) {
var b = e.target.closest('button'); if (!b) return;
var k = b.getAttribute('data-k'); focusCk = focusCk === k ? null : k;
if (sel) { sel = null; select(null, true); } else overlays();
pressed();
if (focusCk) { var r = host.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) host.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); }
});
$('rp-stat').addEventListener('click', function () { var el = $('rp-checks').parentNode; el.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' }); });
var bs = $('rp-share'), bi = $('rp-img');
if (bs) bs.addEventListener('click', share);
if (bi) bi.addEventListener('click', picture);
addEventListener('beforeprint', function () { if (sel) select(null); });
var V3 = { on: false, q: 0 }, WALLH = 250, C3 = 0.866, S3 = 0.5;
var HK = { sofa: 80, eck: 80, sessel: 80, hocker: 42, tisch: 45, rund: 45, ess: 75, essr: 75, schreib: 75, tv: 50, kasten: 80, regal: 190, schrank: 210, bett: 50, teppich: 1.5, teppichr: 1.5, pflanze: 130, lampe: 160, block: 100 };
var MAT = { stoff: '#cdc5b6', holz: '#b38b5d', hell: '#ece8df', dunkel: '#3b3c3d', teppich: '#d8c8a6', gruen: '#5f8160', ton: '#b96a41', licht: '#f0deaa', decke: '#8aa39b', grau: '#c4c4c0' };
function shade(c, f) {
var m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(c), n = m ? 0 : parseInt(c.slice(1), 16), r = m ? +m[1] : n >> 16, g = m ? +m[2] : n >> 8 & 255, b = m ? +m[3] : n & 255;
return 'rgb(' + Math.min(255, Math.round(r * f)) + ',' + Math.min(255, Math.round(g * f)) + ',' + Math.min(255, Math.round(b * f)) + ')';
}
function dims3() { return V3.q % 2 ? [S.d, S.w] : [S.w, S.d]; }
function rot3(x, y, w, h) {
switch (V3.q) {
case 1: return { u: y, v: S.w - x - w, w: h, h: w };
case 2: return { u: S.w - x - w, v: S.d - y - h, w: w, h: h };
case 3: return { u: S.d - y - h, v: x, w: h, h: w };
default: return { u: x, v: y, w: w, h: h };
}
}
function part(it, lx, ly, lw, lh, z0, z1, c, o) {
var a = RP.abs(it, lx, ly), b = RP.abs(it, lx + lw, ly + lh), r = rot3(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
var p = { u0: r.u, v0: r.v, u1: r.u + r.w, v1: r.v + r.h, z0: z0, z1: z1, c: c };
if (o) for (var k in o) p[k] = o[k];
return p;
}
function parts3(it) {
var c = CAT[it.t], k = c.k, w = it.w, h = it.h, H = HK[k] || 60, P = [], rnd = RP.isRound(it), i;
if (k === 'kasten') H = c.tall ? 180 : c.small ? 50 : it.t === 'schuh' ? 100 : 80;
if (k === 'tisch' && it.t === 'eigen') H = 75;
if (k === 'sofa' || k === 'sessel') {
var bd = Math.min(24, h * 0.26), aw = Math.min(18, w * 0.12);
P.push(part(it, 0, 0, w, bd, 0, H, MAT.stoff), part(it, aw, bd, w - 2 * aw, h - bd, 0, 42, shade(MAT.stoff, 1.04)), part(it, 0, bd, aw, h - bd, 0, 58, MAT.stoff), part(it, w - aw, bd, aw, h - bd, 0, 58, MAT.stoff));
} else if (k === 'eck') {
var l = RP.legOf(it), b2 = Math.min(24, l * 0.26), lx = it.flip ? 0 : w - l;
P.push(part(it, 0, 0, w, b2, 0, H, MAT.stoff), part(it, 0, b2, w, l - b2, 0, 42, shade(MAT.stoff, 1.04)), part(it, lx, l, l, h - l, 0, 42, shade(MAT.stoff, 1.04)), part(it, it.flip ? 0 : w - b2, b2, b2, h - b2, 0, H, MAT.stoff));
} else if (k === 'hocker') P.push(part(it, 0, 0, w, h, 0, H, MAT.stoff, { cyl: rnd }));
else if (k === 'rund' || k === 'essr' || (rnd && (k === 'tisch' || k === 'ess'))) {
P.push(part(it, w * 0.36, h * 0.36, w * 0.28, h * 0.28, 0, H - 5, shade(MAT.holz, 0.8), { cyl: 1, noTop: 1 }), part(it, 0, 0, w, h, H - 5, H, MAT.holz, { cyl: 1 }));
} else if (k === 'tisch' || k === 'ess' || k === 'schreib') {
var q = Math.min(6, w * 0.08, h * 0.12), ins = 4;
[[ins, ins], [w - ins - q, ins], [ins, h - ins - q], [w - ins - q, h - ins - q]].forEach(function (p) { P.push(part(it, p[0], p[1], q, q, 0, H - 5, shade(MAT.holz, 0.82), { noTop: 1 })); });
P.push(part(it, 0, 0, w, h, H - 5, H, MAT.holz));
} else if (k === 'tv') {
P.push(part(it, 0, 0, w, h, 0, H, MAT.holz));
P.push(part(it, w * 0.1, Math.max(2, h / 2 - 3), w * 0.8, 5, H + 4, H + 4 + w * 0.45, MAT.dunkel));
} else if (k === 'bett') {
P.push(part(it, 0, 0, w, 8, 0, 95, MAT.holz), part(it, 0, 8, w, h - 8, 0, 30, MAT.holz), part(it, 3, 10, w - 6, h - 13, 30, 50, MAT.hell));
P.push(part(it, 3, 10 + (h - 13) * 0.36, w - 6, (h - 13) * 0.64, 50, 54, MAT.decke));
if (w >= 140) P.push(part(it, w * 0.08, 16, w * 0.36, 42, 50, 60, MAT.hell), part(it, w * 0.56, 16, w * 0.36, 42, 50, 60, MAT.hell));
else P.push(part(it, w * 0.14, 16, w * 0.72, 42, 50, 60, MAT.hell));
} else if (k === 'teppich' || k === 'teppichr') P.push(part(it, 0, 0, w, h, 0, H, MAT.teppich, { cyl: rnd, flat: 1 }));
else if (k === 'pflanze') P.push(part(it, w * 0.2, h * 0.2, w * 0.6, h * 0.6, 0, 34, MAT.ton, { cyl: 1 }), part(it, 0, 0, w, h, 40, 130, MAT.gruen, { ball: 1 }));
else if (k === 'lampe') P.push(part(it, w * 0.1, h * 0.1, w * 0.8, h * 0.8, 0, 3, MAT.dunkel, { cyl: 1 }), part(it, w * 0.46, h * 0.46, w * 0.08, h * 0.08, 3, 136, MAT.dunkel, { cyl: 1, noTop: 1 }), part(it, 0, 0, w, h, 134, 164, MAT.licht, { cyl: 1 }));
else P.push(part(it, 0, 0, w, h, 0, H, k === 'block' ? MAT.grau : k === 'schrank' ? MAT.hell : MAT.holz, { cyl: rnd }));
return P;
}
function order3(items) {
var rest = items.slice(), out = [];
function vor(a, b) { return a.u0 >= b.u1 - 0.5 || a.v0 >= b.v1 - 0.5; }
while (rest.length) {
var pick = -1, i, j;
for (i = 0; i < rest.length && pick < 0; i++) {
var frei = true;
for (j = 0; j < rest.length; j++) if (i !== j && vor(rest[i], rest[j]) && !vor(rest[j], rest[i])) { frei = false; break; }
if (frei) pick = i;
}
if (pick < 0) { pick = 0; for (i = 1; i < rest.length; i++) if (rest[i].u0 + rest[i].u1 + rest[i].v0 + rest[i].v1 < rest[pick].u0 + rest[pick].u1 + rest[pick].v0 + rest[pick].v1) pick = i; }
out.push(rest.splice(pick, 1)[0]);
}
return out;
}
function draw3d() {
var box = $('rp-3d'); if (!box || !V3.on) return;
S = RP.state();
var dm = dims3(), W = dm[0], D = dm[1], PW = Math.max(280, box.clientWidth || 600), mg = 14;
var minX = -D * C3, maxX = W * C3, minY = -WALLH, maxY = (W + D) * S3, k = (PW - 2 * mg) / (maxX - minX), maxH = Math.max(300, innerHeight - 250);
if ((maxY - minY) * k + 2 * mg > maxH) k = (maxH - 2 * mg) / (maxY - minY);
var PH = Math.round((maxY - minY) * k + 2 * mg), ox = (PW - (maxX - minX) * k) / 2;
var cs = getComputedStyle(root), sheet = (cs.getPropertyValue('--sheet') || '').trim() || '#fbfbf8', line = (cs.getPropertyValue('--line') || '').trim() || '#d9d8d1';
function P(u, v, z) { return [((u - v) * C3 - minX) * k + ox, ((u + v) * S3 - z - minY) * k + mg]; }
function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
var sv = E('svg', { viewBox: '0 0 ' + PW + ' ' + PH, width: PW, height: PH, role: 'img', 'aria-label': 'Ansicht des Zimmers von schräg oben mit ' + S.items.length + ' Möbeln. Zum Bearbeiten zurück zum Plan wechseln.' });
E('rect', { x: 0, y: 0, width: PW, height: PH, fill: sheet }, sv);
function poly(a, fill, stroke, sw) { return E('polygon', { points: pts(a), fill: fill, stroke: stroke || 'rgba(0,0,0,.28)', 'stroke-width': sw || 0.8, 'stroke-linejoin': 'round' }, sv); }
poly([P(0, 0, 0), P(W, 0, 0), P(W, D, 0), P(0, D, 0)], '#e9e1d0', line, 1);
var g;
for (g = 50; g < W; g += 50) E('line', { x1: P(g, 0, 0)[0], y1: P(g, 0, 0)[1], x2: P(g, D, 0)[0], y2: P(g, D, 0)[1], stroke: 'rgba(0,0,0,.07)', 'stroke-width': 1 }, sv);
for (g = 50; g < D; g += 50) E('line', { x1: P(0, g, 0)[0], y1: P(0, g, 0)[1], x2: P(W, g, 0)[0], y2: P(W, g, 0)[1], stroke: 'rgba(0,0,0,.07)', 'stroke-width': 1 }, sv);
poly([P(0, 0, 0), P(0, D, 0), P(0, D, WALLH), P(0, 0, WALLH)], '#f1eee6', line, 1);
poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, WALLH), P(0, 0, WALLH)], '#f7f5ef', line, 1);
function opening(o, door) {
var r = o.wall === 'N' ? rot3(o.pos, 0, o.size, 0) : o.wall === 'S' ? rot3(o.pos, S.d, o.size, 0) : o.wall === 'W' ? rot3(0, o.pos, 0, o.size) : rot3(S.w, o.pos, 0, o.size);
var z0 = door ? 0 : 92, z1 = door ? 205 : 215, fill = door ? '#cfc6b4' : '#d5e5ee', a, m;
if (Math.abs(r.u) < 0.5 && r.w < 0.5) { a = [P(0, r.v, z0), P(0, r.v + r.h, z0), P(0, r.v + r.h, z1), P(0, r.v, z1)]; poly(a, fill, 'rgba(0,0,0,.4)', 1.2); if (!door) { m = r.v + r.h / 2; E('line', { x1: P(0, m, z0)[0], y1: P(0, m, z0)[1], x2: P(0, m, z1)[0], y2: P(0, m, z1)[1], stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 }, sv); } }
else if (Math.abs(r.v) < 0.5 && r.h < 0.5) { a = [P(r.u, 0, z0), P(r.u + r.w, 0, z0), P(r.u + r.w, 0, z1), P(r.u, 0, z1)]; poly(a, fill, 'rgba(0,0,0,.4)', 1.2); if (!door) { m = r.u + r.w / 2; E('line', { x1: P(m, 0, z0)[0], y1: P(m, 0, z0)[1], x2: P(m, 0, z1)[0], y2: P(m, 0, z1)[1], stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 }, sv); } }
else { var e1 = P(r.u, r.v, 0), e2 = P(r.u + r.w, r.v + r.h, 0); E('line', { x1: e1[0], y1: e1[1], x2: e2[0], y2: e2[1], stroke: door ? '#a8853c' : '#6f9db5', 'stroke-width': 5, 'stroke-linecap': 'round' }, sv); }
}
S.wins.forEach(function (o) { opening(o, false); }); S.doors.forEach(function (o) { opening(o, true); });
var items = S.items.map(function (it) {
var b = RP.box(it), r = rot3(b.x, b.y, b.w, b.h);
return { u0: r.u, v0: r.v, u1: r.u + r.w, v1: r.v + r.h, flat: !!CAT[it.t].flat, parts: parts3(it).sort(function (a, c) { return a.z0 - c.z0 || (a.u0 + a.u1 + a.v0 + a.v1) - (c.u0 + c.u1 + c.v0 + c.v1); }) };
});
var list = items.filter(function (i) { return i.flat; }).concat(order3(items.filter(function (i) { return !i.flat; })));
list.forEach(function (it) {
it.parts.forEach(function (p) {
var cu = (p.u0 + p.u1) / 2, cv = (p.v0 + p.v1) / 2, r = Math.min(p.u1 - p.u0, p.v1 - p.v0) / 2, rx = r * 1.2247 * k, ry = r * 0.7071 * k, a, b;
if (p.ball) { a = P(cu, cv, (p.z0 + p.z1) / 2); var rr = (p.z1 - p.z0) / 2 * k * 0.8; E('circle', { cx: a[0], cy: a[1], r: rr, fill: p.c, stroke: 'rgba(0,0,0,.25)', 'stroke-width': 0.8 }, sv); E('circle', { cx: a[0] - rr * 0.28, cy: a[1] - rr * 0.3, r: rr * 0.45, fill: shade(p.c, 1.16) }, sv); return; }
if (p.cyl) {
a = P(cu, cv, p.z0); b = P(cu, cv, p.z1);
if (p.z1 - p.z0 > 2) E('path', { d: 'M' + (b[0] - rx).toFixed(1) + ' ' + b[1].toFixed(1) + 'V' + a[1].toFixed(1) + 'A' + rx.toFixed(1) + ' ' + ry.toFixed(1) + ' 0 0 0 ' + (a[0] + rx).toFixed(1) + ' ' + a[1].toFixed(1) + 'V' + b[1].toFixed(1) + 'z', fill: shade(p.c, 0.84), stroke: 'rgba(0,0,0,.28)', 'stroke-width': 0.8 }, sv);
if (!p.noTop) E('ellipse', { cx: b[0], cy: b[1], rx: rx, ry: ry, fill: p.c, stroke: 'rgba(0,0,0,.28)', 'stroke-width': 0.8 }, sv);
return;
}
poly([P(p.u1, p.v0, p.z0), P(p.u1, p.v1, p.z0), P(p.u1, p.v1, p.z1), P(p.u1, p.v0, p.z1)], shade(p.c, 0.88));
poly([P(p.u0, p.v1, p.z0), P(p.u1, p.v1, p.z0), P(p.u1, p.v1, p.z1), P(p.u0, p.v1, p.z1)], shade(p.c, 0.74));
if (!p.noTop) poly([P(p.u0, p.v0, p.z1), P(p.u1, p.v0, p.z1), P(p.u1, p.v1, p.z1), P(p.u0, p.v1, p.z1)], p.c);
});
});
box.textContent = ''; box.appendChild(sv); V3.svg = sv; V3.w = PW; V3.h = PH;
}
function toggle3d(on) {
V3.on = on; if (on && sel) select(null);
var sh = host.parentNode; sh.classList.toggle('v3', on);
$('rp-3d').hidden = !on; $('rp-3d-rot').hidden = !on; $('rp-3d-pic').hidden = !on; $('rp-tool').hidden = on; if ($('rp-3d-n')) $('rp-3d-n').hidden = !on;
var b = $('rp-3d-btn'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.lastChild.nodeValue = on ? 'Zum Plan' : '3D-Ansicht';
if (on) draw3d(); else { renderAll(); overlays(); }
}
function picture3d() {
function fail() { toast('Das Bild klappt in diesem Browser nicht. Nimm einen Screenshot.'); }
function down(blob) { var a = d.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = 'zimmer-3d.png'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast('Bild gespeichert'); }
try {
var cl = V3.svg.cloneNode(true), W = V3.w, H = V3.h + 30; cl.setAttribute('xmlns', NS); cl.setAttribute('viewBox', '0 0 ' + W + ' ' + H); cl.setAttribute('width', W); cl.setAttribute('height', H);
var bg = cl.firstChild.getAttribute('fill'); E('rect', { x: 0, y: V3.h, width: W, height: 30, fill: bg }, cl);
var t = E('text', { x: W - 12, y: V3.h + 18, 'text-anchor': 'end', fill: '#5c605d', 'font-family': 'Helvetica,Arial,sans-serif', 'font-size': 12 }, cl); t.textContent = 'stil-daheim.de/raumplaner';
var img = new Image(), sc = Math.max(2, Math.min(4, 1600 / W));
img.onload = function () {
try {
var cv = d.createElement('canvas'); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
cv.toBlob(function (blob) {
if (!blob) return fail();
var file = null; try { file = new File([blob], 'zimmer-3d.png', { type: 'image/png' }); } catch (x) { }
if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Mein Zimmer' }).catch(function (err) { if (!err || err.name !== 'AbortError') down(blob); }); return; }
down(blob);
}, 'image/png');
} catch (x) { fail(); }
};
img.onerror = fail; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl));
} catch (x) { fail(); }
}
if ($('rp-3d-btn')) {
var renderPlan = renderAll;
renderAll = function () { renderPlan(); if (V3.on) draw3d(); };
$('rp-3d-btn').addEventListener('click', function () { toggle3d(!V3.on); });
$('rp-3d-rot').addEventListener('click', function () { V3.q = (V3.q + 1) % 4; draw3d(); });
$('rp-3d-pic').addEventListener('click', picture3d);
window.RP3 = { on: function () { return V3.on; }, parts: parts3, view: function () { return V3.q; } };
}
renderCat(); renderAll(); commit(); renderTool();
if (undo.length) $('rp-undo').disabled = false;
if (shared) setTimeout(function () { toast('Geteilter Plan geöffnet. „Rückgängig“ holt deinen eigenen zurück.'); }, 900);
if (window.ResizeObserver) new ResizeObserver(function () { if (!drag && host.clientWidth && Math.abs(host.clientWidth - lastW) > 1) { renderAll(); overlays(); } }).observe(host);
else addEventListener('resize', function () { if (!drag) { renderAll(); overlays(); } });
root.classList.add('rp-ready');
if (pristine && !RM) { var first = S.items.filter(function (i) { return !CAT[i.t].flat && !CAT[i.t].small; })[0]; if (first && els[first.id] && 'IntersectionObserver' in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { if (els[first.id]) { els[first.id].classList.add('rp-wink'); setTimeout(function () { if (els[first.id]) els[first.id].classList.remove('rp-wink'); }, 1500); } }, 500); } }, { threshold: 0.6 }); io.observe(host); } }
})();
