// Générateur des niveaux en couleur (source blanche, diffracteur, filtres, piège).
// node gen-couleur.js <index 0..33> <graine> <budget ms>   -> lv/c<index>.json
const path = require('path');
const { trace, solve, K, NOR } = require('./engine.js');
const idx = +process.argv[2];
let seed = (+process.argv[3] || 7) * 7919 + idx * 104729;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const ri = n => Math.floor(rnd() * n);

// [taille, pièces, balises max]
const RAW = [
  [7, 'D', 0], [7, 'DM', 0], [7, 'DMM', 1], [7, 'DX', 1], [8, 'DXM', 1], [8, 'DMP', 1],
  [7, 'rMM', 2], [8, 'DgM', 1], [8, 'DMMM', 2], [8, 'DXMM', 2], [8, 'DSM', 1], [8, 'DbMP', 2],
  [8, 'DUU', 1], [8, 'DTM', 1], [8, 'DXXM', 2], [8, 'DFFM', 2], [8, 'DMMP', 2], [8, 'SrbM', 2],
  [9, 'DXMMM', 2], [9, 'DrMM', 2], [9, 'DSMM', 2], [9, 'DUUP', 2], [9, 'DTMM', 2], [9, 'DXMPP', 2],
  [9, 'DgbMM', 2], [9, 'DFFX', 3], [9, 'DSXM', 2], [9, 'DTXM', 2], [9, 'DMMMM', 3], [9, 'DSMP', 3],
  [9, 'DXXMM', 3], [9, 'DTMP', 3], [9, 'DSUU', 3], [10, 'DSXMP', 3],
];
if (process.argv[2] === 'count') { console.log(RAW.length); process.exit(0); }
function mk(n, p, c) {
  return { w: n, h: n, pieces: p.split(''), checks: c, deco: n >= 9 ? 2 : 1,
    maxW: Math.round(n * 1.2) + (p.includes('F') ? 3 : 0), time: 20 + 9 * p.length + 5 * c };
}

function randomEntry(w, h) {
  const side = ri(4);
  if (side === 0) return { x: 0, y: 1 + ri(h - 2), d: 0, c: 'W' };
  if (side === 1) return { x: 1 + ri(w - 2), y: 0, d: 1, c: 'W' };
  if (side === 2) return { x: w - 1, y: 1 + ri(h - 2), d: 2, c: 'W' };
  return { x: 1 + ri(w - 2), y: h - 1, d: 3, c: 'W' };
}
const sig = s => Object.keys(s.placed).sort().map(k => k + s.placed[k].t + s.placed[k].o).join('|');

function attempt(spec, deadline) {
  const entry = randomEntry(spec.w, spec.h), ek = K(entry.x, entry.y);
  const placed = {};
  // le diffracteur d'abord, puis le reste dans le désordre
  const uniq = spec.pieces.filter((t, i) => !(t === 'F' && spec.pieces.indexOf('F') !== i));
  const pcs = uniq.filter(t => t === 'D').concat(uniq.filter(t => t !== 'D').sort(() => rnd() - 0.5));
  const lvl0 = { w: spec.w, h: spec.h, walls: [], entry, exits: [], pieces: spec.pieces };
  for (const t of pcs) {
    const tr = trace(lvl0, placed);
    const c = Object.keys(tr.cells).filter(k => !placed[k] && k !== ek);
    if (!c.length) return null;
    const at = c[ri(c.length)];
    placed[at] = { t, o: ri(NOR[t]) };
    if (t === 'F') {
      let other = null;
      for (let n = 0; n < 30 && !other; n++) { const k = K(ri(spec.w), ri(spec.h)); if (!placed[k] && k !== ek && k !== at) other = k; }
      if (!other) return null;
      placed[other] = { t: 'F', o: 0 };
    }
  }
  const tr = trace(lvl0, placed);
  if (Object.keys(tr.hit).length !== spec.pieces.length) return null;
  const exits = [];
  for (const f of tr.fails) {
    let d = -1, x = f.x, y = f.y;
    if (x === -0.5) { d = 2; x = 0; } else if (x === spec.w - 0.5) { d = 0; x = spec.w - 1; }
    else if (y === -0.5) { d = 3; y = 0; } else if (y === spec.h - 0.5) { d = 1; y = spec.h - 1; }
    else return null;
    if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
    if (x === entry.x && y === entry.y) return null;
    if (exits.some(s => s.x === x && s.y === y)) return null;
    exits.push({ x, y, d, c: f.c });
  }
  if (!exits.length || exits.length > 4) return null;
  // au moins deux couleurs en jeu à la sortie quand il y a un diffracteur
  if (spec.pieces.includes('D') && new Set(exits.map(s => s.c)).size < Math.min(2, exits.length)) return null;
  for (const s of exits) if (Math.abs(s.x - entry.x) + Math.abs(s.y - entry.y) < 3) return null;
  const level = { w: spec.w, h: spec.h, walls: [], checks: [], entry, exits, pieces: spec.pieces, time: spec.time };
  const checks = level.checks;
  const t2 = trace(level, placed);
  if (!t2.ok) return null;
  const own = Object.assign({}, t2.cells);
  // balises possibles: (case du trajet sans pièce, couleur qui y passe)
  const cand = [];
  for (const kc in t2.cellsC) {
    const k = kc.slice(0, -1), c = kc.slice(-1);
    if (!placed[k] && k !== ek) cand.push([k, c]);
  }
  const mySig = sig({ placed });
  for (let it = 0; it < 50; it++) {
    const sols = solve(level, 30, deadline);
    if (sols.timedOut) return null;
    if (!sols.some(s => sig(s) === mySig) && sols.length < 30) return null;
    const others = sols.filter(s => sig(s) !== mySig);
    if (!others.length) {
      const fin = (() => {
        let deco = spec.deco, tries = 0;
        while (deco > 0 && tries++ < 50) {
          const x = ri(spec.w), y = ri(spec.h), k = K(x, y);
          if (own[k] || level.walls.some(w => w[0] === x && w[1] === y)) continue;
          level.walls.push([x, y]); deco--;
        }
        return solve(level, 3, deadline);
      })();
      if (fin.timedOut || fin.length !== 1 || sig(fin[0]) !== mySig) return null;
      return { level, solution: placed, pathLen: Object.keys(own).length };
    }
    if (checks.length < spec.checks) {
      let best = null, bs = 0;
      for (const [k, c] of cand) {
        if (checks.some(q => K(q[0], q[1]) === k)) continue;
        const n = others.filter(s => !s.cellsC[k + c]).length + rnd() * 0.5;
        if (n > bs && n >= 1) { bs = n; best = [k, c]; }
      }
      if (best) { const q = best[0].split(',').map(Number); checks.push([q[0], q[1], best[1]]); continue; }
    }
    if (level.walls.length >= spec.maxW) return null;
    const score = {};
    for (const s of others) for (const k in s.cells) if (!own[k]) score[k] = (score[k] || 0) + 1;
    const ks = Object.keys(score);
    if (!ks.length) return null;
    ks.sort((a, b) => score[b] - score[a]);
    const top = ks.filter(k => score[k] >= score[ks[0]] * 0.8);
    level.walls.push(top[ri(top.length)].split(',').map(Number));
  }
  return null;
}

const BUDGET = +process.argv[4] || 40000;
const [n, p, c] = process.argv[5] ? [+process.argv[6], process.argv[5], +process.argv[7]] : RAW[idx];
// si la combinaison prévue ne donne rien, on essaie sans la dernière pièce
const tries = [mk(n, p, c), mk(n, p, c + 1), mk(n, p.slice(0, -1), c + 1)];
for (let v = 0; v < tries.length; v++) {
  const spec = tries[v];
  let best = null, found = 0;
  const t0 = Date.now(), budget = v === 0 ? BUDGET : BUDGET / 2;
  while (found < 8 && Date.now() - t0 < budget) {
    const r = attempt(spec, Math.min(t0 + budget, Date.now() + 8000));
    if (!r) continue;
    found++;
    r.q = r.pathLen - r.level.walls.length * 1.5 + r.level.exits.length * 2;
    if (!best || r.q > best.q) best = r;
  }
  if (!best) continue;
  console.error('couleur', idx + 1, spec.pieces.join(''), v ? '(repli ' + v + ')' : '', 'trouvés', found, 'murs', best.level.walls.length, 'balises', best.level.checks.length, 'sorties', best.level.exits.length, 'trajet', best.pathLen);
  require('fs').writeFileSync(path.join(__dirname, 'lv', 'c' + idx + '.json'), JSON.stringify({ ...best.level, solution: best.solution }));
  process.exit(0);
}
console.error('ECHEC couleur', idx + 1, p);
process.exit(1);
