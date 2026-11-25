const E = require('./engine.js');
const { trace, solve, K, NOR } = E;
const idx = +process.argv[2];
let seed = (+process.argv[3] || 7) * 7919 + idx * 104729;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const ri = n => Math.floor(rnd() * n);

// [taille, pièces, balises]
const RAW = [
  [6, 'M', 0], [6, 'MM', 0], [6, 'MM', 1], [7, 'MP', 0], [7, 'MMM', 0], [7, 'MMP', 1],
  [7, 'UU', 0], [7, 'UUP', 1], [7, 'SM', 0], [7, 'SMM', 1], [7, 'TM', 0], [8, 'TMM', 1],
  [7, 'FFM', 1], [8, 'FFMM', 2], [8, 'MMPP', 1], [8, 'SMP', 1], [8, 'UUU', 1], [8, 'MMMM', 2],
  [8, 'TMP', 1], [8, 'SUU', 1], [8, 'FFMP', 2], [8, 'SSMM', 1], [8, 'FFSM', 2], [9, 'TMMP', 2],
  [9, 'UUUP', 2], [9, 'STMM', 1], [9, 'FFTM', 2], [9, 'SMPP', 2], [9, 'SSMP', 2], [9, 'STMP', 2],
];
const SPECS = RAW.map(([n, p, c]) => ({ w: n, h: n, pieces: p.split(''), checks: c, deco: n >= 9 ? 2 : 1,
  maxW: Math.round(n * 1.1) + (p.includes('F') ? 3 : 0), time: 15 + 9 * p.length + 5 * c }));
if (process.argv[2] === 'count') { console.log(SPECS.length); process.exit(0); }

function randomEntry(w, h) {
  const side = ri(4);
  if (side === 0) return { x: 0, y: 1 + ri(h - 2), d: 0 };
  if (side === 1) return { x: 1 + ri(w - 2), y: 0, d: 1 };
  if (side === 2) return { x: w - 1, y: 1 + ri(h - 2), d: 2 };
  return { x: 1 + ri(w - 2), y: h - 1, d: 3 };
}
const sig = s => Object.keys(s.placed).sort().map(k => k + s.placed[k].t + s.placed[k].o).join('|');

function attempt(spec, deadline) {
  const entry = randomEntry(spec.w, spec.h), ek = K(entry.x, entry.y);
  const placed = {};
  const pcs = spec.pieces.filter((t, i) => !(t === 'F' && spec.pieces.indexOf('F') !== i)).sort(() => rnd() - 0.5);
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
    exits.push({ x, y, d });
  }
  const nSplit = spec.pieces.filter(t => t === 'S' || t === 'T').length;
  if (exits.length !== nSplit + 1) return null;
  for (const s of exits) if (Math.abs(s.x - entry.x) + Math.abs(s.y - entry.y) < 3) return null;
  const pathFree = Object.keys(tr.cells).filter(k => !placed[k] && k !== ek);
  if (pathFree.length < spec.checks) return null;
  const checks = [];
  const level = { w: spec.w, h: spec.h, walls: [], checks, entry, exits, pieces: spec.pieces, time: spec.time };
  const t2 = trace(level, placed);
  if (!t2.ok) return null;
  const own = Object.assign({}, t2.cells);
  const mySig = sig({ placed });
  for (let it = 0; it < 40; it++) {
    const sols = solve(level, 30, deadline);
    if (sols.timedOut) return null;
    if (!sols.some(s => sig(s) === mySig) && sols.length < 30) return null;
    const others = sols.filter(s => sig(s) !== mySig);
    if (!others.length) {
      const rest = pathFree.filter(k => !checks.some(c => K(c[0], c[1]) === k));
      while (checks.length < spec.checks && rest.length) checks.push(rest.splice(ri(rest.length), 1)[0].split(',').map(Number));
      let deco = spec.deco, tries = 0;
      while (deco > 0 && tries++ < 50) {
        const x = ri(spec.w), y = ri(spec.h), k = K(x, y);
        if (own[k] || level.walls.some(w => w[0] === x && w[1] === y)) continue;
        level.walls.push([x, y]); deco--;
      }
      const fin = solve(level, 3, deadline);
      if (fin.timedOut || fin.length !== 1 || sig(fin[0]) !== mySig) return null;
      return { level, solution: placed, pathLen: Object.keys(own).length };
    }
    if (checks.length < spec.checks) {
      // balise sur une case du trajet que le plus de solutions parasites évitent
      let bk = null, bs = 0;
      for (const k of pathFree) {
        if (checks.some(c => K(c[0], c[1]) === k)) continue;
        const n = others.filter(s => !s.cells[k]).length + rnd() * 0.5;
        if (n > bs && n >= 1) { bs = n; bk = k; }
      }
      if (bk) { checks.push(bk.split(',').map(Number)); continue; }
    }
    if (level.walls.length >= spec.maxW) return null;
    const score = {};
    for (const s of others) for (const k in s.cells) if (!own[k]) score[k] = (score[k] || 0) + 1;
    const ks = Object.keys(score);
    if (!ks.length) return null;
    ks.sort((a, b) => score[b] - score[a]);
    const best = ks.filter(k => score[k] >= score[ks[0]] * 0.8);
    level.walls.push(best[ri(best.length)].split(',').map(Number));
  }
  return null;
}

const spec = SPECS[idx];
let best = null, found = 0;
const t0 = Date.now(), BUDGET = +process.argv[4] || 40000;
while (found < 12 && Date.now() - t0 < BUDGET) {
  const r = attempt(spec, Math.min(t0 + BUDGET, Date.now() + 8000));
  if (!r) continue;
  found++;
  r.q = r.pathLen - r.level.walls.length * 1.5;
  if (!best || r.q > best.q) best = r;
}
if (!best) { console.error('ECHEC', idx + 1, spec.pieces.join('')); process.exit(1); }
console.error('niveau', idx + 1, spec.pieces.join(''), 'trouvés', found, 'murs', best.level.walls.length, 'trajet', best.pathLen, ((Date.now() - t0) / 1000 | 0) + 's');
require('fs').writeFileSync(require('path').join(__dirname, 'lv', idx + '.json'), JSON.stringify({ ...best.level, solution: best.solution }));
