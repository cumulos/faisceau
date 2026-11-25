// Moteur partagé (jeu + générateur). Directions: 0=E 1=S 2=O 3=N, y vers le bas.
// Pièces: M miroir, U miroir sans tain, P prisme, S séparateur, T diviseur en T, F fibre (paire).
var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
var REFL = [[3, 2, 1, 0], [1, 0, 3, 2]]; // diagonale 0 = "/", 1 = "\"
var NOR = { M: 2, U: 4, P: 2, S: 2, T: 1, F: 1 };
function K(x, y) { return x + ',' + y; }

// Une étape: faisceau entrant en (x,y) direction d sur la pièce p (ou rien).
// Retourne null si absorbé, sinon liste de sorties [sx, sy, nx, ny, nd, diag]
function stepBeam(placed, x, y, d, p) {
  if (!p) return [[x, y, x + DX[d], y + DY[d], d, 0]];
  var diag = p.o & 1, r = REFL[diag][d];
  if (p.t === 'M') return [[x, y, x + DX[r], y + DY[r], r, 0]];
  if (p.t === 'U') {
    var faceA = diag === 0 ? (d === 0 || d === 1) : (d === 0 || d === 3);
    if (faceA !== ((p.o >> 1) === 0)) return [[x, y, x + DX[d], y + DY[d], d, 0]]; // face sans tain: traverse
    return [[x, y, x + DX[r], y + DY[r], r, 0]];
  }
  if (p.t === 'S') return [[x, y, x + DX[d], y + DY[d], d, 0], [x, y, x + DX[r], y + DY[r], r, 0]];
  if (p.t === 'P') return [[x, y, x + DX[d] + DX[r], y + DY[d] + DY[r], d, 1]];
  if (p.t === 'T') { var a = (d + 1) % 4, b = (d + 3) % 4; return [[x, y, x + DX[a], y + DY[a], a, 0], [x, y, x + DX[b], y + DY[b], b, 0]]; }
  if (p.t === 'F') {
    var me = K(x, y), other = null;
    for (var k in placed) if (k !== me && placed[k].t === 'F') other = k;
    if (!other) return null;
    var q = other.split(','), ox = +q[0], oy = +q[1];
    return [[ox, oy, ox + DX[d], oy + DY[d], d, 0]];
  }
  return null;
}
function exitIndex(level, x, y, d) {
  for (var j = 0; j < level.exits.length; j++) { var s = level.exits[j]; if (s.x === x && s.y === y && s.d === d) return j; }
  return -1;
}

// Trace complète pour l'affichage et le verdict.
function trace(level, placed) {
  var walls = {}; level.walls.forEach(function (w) { walls[K(w[0], w[1])] = 1; });
  var segs = [], fails = [], exitsHit = {}, hit = {}, cells = {}, seen = {};
  var e = level.entry;
  var heads = [{ x: e.x, y: e.y, d: e.d, fx: e.x - DX[e.d] * 0.5, fy: e.y - DY[e.d] * 0.5, step: 0 }];
  var guard = 0;
  while (heads.length && guard++ < 5000) {
    var h = heads.shift(), x = h.x, y = h.y, d = h.d;
    if (x < 0 || y < 0 || x >= level.w || y >= level.h) { // diagonale hors grille
      segs.push({ x1: h.fx, y1: h.fy, x2: (h.fx + x) / 2, y2: (h.fy + y) / 2, step: h.step });
      fails.push({ x: (h.fx + x) / 2, y: (h.fy + y) / 2 });
      continue;
    }
    if (walls[K(x, y)]) {
      var mx = (h.fx + x) / 2, my = (h.fy + y) / 2;
      if (Math.abs(x - h.fx) + Math.abs(y - h.fy) < 1.01) { mx = x - DX[d] * 0.5; my = y - DY[d] * 0.5; }
      segs.push({ x1: h.fx, y1: h.fy, x2: mx, y2: my, step: h.step });
      fails.push({ x: mx, y: my });
      continue;
    }
    segs.push({ x1: h.fx, y1: h.fy, x2: x, y2: y, step: h.step });
    var sk = K(x, y) + ',' + d;
    if (seen[sk]) continue;
    seen[sk] = 1; cells[K(x, y)] = 1;
    var p = placed[K(x, y)];
    if (p) hit[K(x, y)] = 1;
    var outs = stepBeam(placed, x, y, d, p);
    if (!outs) { fails.push({ x: x, y: y }); continue; }
    for (var i = 0; i < outs.length; i++) {
      var o = outs[i], sx = o[0], sy = o[1], nx = o[2], ny = o[3], nd = o[4];
      if (sx !== x || sy !== y) { cells[K(sx, sy)] = 1; hit[K(sx, sy)] = 1; }
      if (!o[5] && (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h)) {
        var ex = exitIndex(level, sx, sy, nd);
        if (ex >= 0) { exitsHit[ex] = 1; segs.push({ x1: sx, y1: sy, x2: sx + DX[nd] * 0.95, y2: sy + DY[nd] * 0.95, step: h.step + 1 }); }
        else { segs.push({ x1: sx, y1: sy, x2: sx + DX[nd] * 0.5, y2: sy + DY[nd] * 0.5, step: h.step + 1 }); fails.push({ x: sx + DX[nd] * 0.5, y: sy + DY[nd] * 0.5 }); }
      } else heads.push({ x: nx, y: ny, d: nd, fx: sx, fy: sy, step: h.step + 1 });
    }
  }
  var checks = level.checks || [], checksHit = [];
  checks.forEach(function (c, i) { if (cells[K(c[0], c[1])]) checksHit.push(i); });
  var exits = Object.keys(exitsHit).map(Number);
  return { segs: segs, fails: fails, exits: exits, checks: checksHit, hit: hit, cells: cells,
    ok: fails.length === 0 && exits.length === level.exits.length && checksHit.length === checks.length };
}

// Énumère les solutions (pièces posées uniquement sur le trajet), jusqu'à `limit`.
function solve(level, limit, deadline) {
  var walls = {}; level.walls.forEach(function (w) { walls[K(w[0], w[1])] = 1; });
  var checks = level.checks || [], checkSet = {};
  checks.forEach(function (c) { checkSet[K(c[0], c[1])] = 1; });
  var sols = [], timedOut = false;
  var counts0 = {}; level.pieces.forEach(function (t) { counts0[t] = (counts0[t] || 0) + 1; });
  var free = [];
  for (var yy = 0; yy < level.h; yy++) for (var xx = 0; xx < level.w; xx++) { var kk = K(xx, yy); if (!walls[kk] && !checkSet[kk]) free.push(kk); }
  function rec(placed, empty, counts) {
    if (sols.length >= limit || timedOut) return;
    if (deadline && Date.now() > deadline) { timedOut = true; return; }
    var seen = {}, cells = {}, exitsHit = {}, e = level.entry, heads = [[e.x, e.y, e.d]], branch = null;
    while (heads.length) {
      var h = heads.shift(), x = h[0], y = h[1], d = h[2];
      if (x < 0 || y < 0 || x >= level.w || y >= level.h) return;
      var k = K(x, y);
      if (walls[k]) return;
      var sk = k + ',' + d; if (seen[sk]) continue; seen[sk] = 1; cells[k] = 1;
      var p = placed[k];
      if (!p && !empty[k] && !checkSet[k]) { branch = k; break; }
      var outs = stepBeam(placed, x, y, d, p);
      if (!outs) return;
      for (var i = 0; i < outs.length; i++) {
        var o = outs[i]; cells[K(o[0], o[1])] = 1;
        if (!o[5] && (o[2] < 0 || o[3] < 0 || o[2] >= level.w || o[3] >= level.h)) {
          var ex = exitIndex(level, o[0], o[1], o[4]);
          if (ex < 0) return;
          exitsHit[ex] = 1;
        } else heads.push([o[2], o[3], o[4]]);
      }
    }
    if (!branch) {
      if (Object.keys(exitsHit).length !== level.exits.length) return;
      for (var c = 0; c < checks.length; c++) if (!cells[K(checks[c][0], checks[c][1])]) return;
      sols.push({ placed: JSON.parse(JSON.stringify(placed)), cells: cells });
      return;
    }
    var e2 = Object.assign({}, empty); e2[branch] = 1;
    rec(placed, e2, counts);
    for (var t in counts) {
      if (!counts[t]) continue;
      var c2 = Object.assign({}, counts);
      if (t === 'F') {
        c2.F = 0;
        for (var f = 0; f < free.length; f++) {
          var fk = free[f];
          if (fk === branch || placed[fk] || empty[fk]) continue;
          var pf = Object.assign({}, placed); pf[branch] = { t: 'F', o: 0 }; pf[fk] = { t: 'F', o: 0 };
          rec(pf, empty, c2);
        }
        continue;
      }
      c2[t]--;
      for (var o2 = 0; o2 < NOR[t]; o2++) {
        var p2 = Object.assign({}, placed); p2[branch] = { t: t, o: o2 };
        rec(p2, empty, c2);
      }
    }
  }
  rec({}, {}, counts0);
  sols.timedOut = timedOut;
  return sols;
}
if (typeof module !== 'undefined') module.exports = { trace: trace, solve: solve, K: K, DX: DX, DY: DY, REFL: REFL, NOR: NOR };
