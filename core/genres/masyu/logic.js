// Masyu: a single loop through cell centers. White pearl: pass straight through, and turn in the
// cell before or after. Black pearl: turn here, and go straight through both neighbouring cells.
// Edges: h(r,c) joins (r,c)-(r,c+1) -> r*(cols-1)+c ; v(r,c) joins (r,c)-(r+1,c) -> H + r*cols + c.
import { Rng } from "../../lib/rng.js";
import { provisionalRating, BAND_LABELS } from "../../lib/difficulty.js";
import { randomInside } from "../slitherlink/logic.js";
import { flood } from "../../lib/grid.js";

export const UNKNOWN = 0, LINE = 1, CROSS = 2;
export const NONE = 0, WHITE = 1, BLACK = 2;
const L_ = 0, R_ = 1, U_ = 2, D_ = 3;

export function layout(rows, cols) {
  const H = rows * (cols - 1), V = (rows - 1) * cols, E = H + V, n = rows * cols;
  const hIdx = (r, c) => r * (cols - 1) + c, vIdx = (r, c) => H + r * cols + c;
  const cellEdges = []; // [left, right, up, down], -1 if none
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cellEdges.push([c > 0 ? hIdx(r, c - 1) : -1, c < cols - 1 ? hIdx(r, c) : -1, r > 0 ? vIdx(r - 1, c) : -1, r < rows - 1 ? vIdx(r, c) : -1]);
  const ends = new Array(E);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols - 1; c++) ends[hIdx(r, c)] = [r * cols + c, r * cols + c + 1];
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols; c++) ends[vIdx(r, c)] = [r * cols + c, (r + 1) * cols + c];
  const step = (i, d) => { const r = Math.floor(i / cols), c = i % cols; const rr = r + (d === D_) - (d === U_), cc = c + (d === R_) - (d === L_); return rr < 0 || cc < 0 || rr >= rows || cc >= cols ? -1 : rr * cols + cc; };
  return { rows, cols, n, H, V, E, hIdx, vIdx, cellEdges, ends, step };
}

// ------------------------------------------------------------------ random loop
// The cells of a rows×cols grid are the vertices of a (rows-1)×(cols-1) "dual" grid. A simply
// connected region of dual cells (Slitherlink's generator) has a boundary that is one simple loop
// through cell centres, with real straights and corners, so Masyu reuses it.
export function loopFromRegion(L, inside) {
  const { rows, cols, E, hIdx, vIdx } = L;
  const dr = rows - 1, dc = cols - 1;
  const isIn = (r, c) => r >= 0 && c >= 0 && r < dr && c < dc && inside[r * dc + c] === 1;
  const edges = new Uint8Array(E);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols - 1; c++) if (isIn(r - 1, c) !== isIn(r, c)) edges[hIdx(r, c)] = 1;
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols; c++) if (isIn(r, c - 1) !== isIn(r, c)) edges[vIdx(r, c)] = 1;
  return edges;
}
export function randomRegion(L, rng, opts = {}) {
  const dr = L.rows - 1, dc = L.cols - 1;
  return randomInside(dr, dc, rng, { fill: opts.fill ?? rng.range(40, 62) / 100, erode: opts.erode ?? Math.round(dr * dc * 0.15) });
}
export function randomLoop(L, rng, opts = {}) { return loopFromRegion(L, randomRegion(L, rng, opts)); }

/** Is this dual region still a single simple loop's inside? (connected, complement connected, no checkerboard) */
function regionValid(inside, dr, dc) {
  const n = dr * dc; let count = 0, first = -1;
  for (let i = 0; i < n; i++) if (inside[i]) { count++; if (first < 0) first = i; }
  if (count === 0 || count === n) return false;
  const isIn = (i) => inside[i] === 1;
  if (flood(first, dr, dc, isIn).size !== count) return false;
  const outs = []; for (let i = 0; i < n; i++) if (!inside[i]) outs.push(i);
  const border = outs.filter((i) => { const r = Math.floor(i / dc), c = i % dc; return r === 0 || c === 0 || r === dr - 1 || c === dc - 1; });
  if (flood(border.length ? border : [outs[0]], dr, dc, (j) => !inside[j]).size !== outs.length) return false;
  for (let r = 0; r < dr - 1; r++) for (let c = 0; c < dc - 1; c++) {
    const a = r * dc + c, b = a + 1, cc = a + dc, d = cc + 1;
    if ((isIn(a) && isIn(d) && !isIn(b) && !isIn(cc)) || (isIn(b) && isIn(cc) && !isIn(a) && !isIn(d))) return false;
  }
  return true;
}

/** Which pearl each loop cell could carry: WHITE / BLACK / NONE. */
export function pearlCandidates(L, loop) {
  const { n, cellEdges, step } = L;
  const on = (i, d) => cellEdges[i][d] >= 0 && loop[cellEdges[i][d]] === 1;
  const straightH = (i) => on(i, L_) && on(i, R_), straightV = (i) => on(i, U_) && on(i, D_);
  const out = new Int8Array(n);
  for (let i = 0; i < n; i++) {
    let deg = 0; for (let d = 0; d < 4; d++) if (on(i, d)) deg++;
    if (deg !== 2) continue;
    if (straightH(i) || straightV(i)) {
      const [d1, d2] = straightH(i) ? [L_, R_] : [U_, D_];
      const turns = (d) => { const j = step(i, d); return !(straightH(j) || straightV(j)); };
      if (turns(d1) || turns(d2)) out[i] = WHITE;
    } else {
      const dirs = [L_, R_, U_, D_].filter((d) => on(i, d));
      if (dirs.every((d) => on(step(i, d), d))) out[i] = BLACK;
    }
  }
  return out;
}

// ------------------------------------------------------------------ oracle
/** pearls: Int8Array(n) of NONE/WHITE/BLACK. Returns { count, branches, solution: Uint8Array(E) }. */
export function countSolutions(L, pearls, limit = 2, maxBranches = 100000, initial = null) {
  const { n, E, cellEdges, ends, step } = L;
  const pearlCells = []; for (let i = 0; i < n; i++) if (pearls[i]) pearlCells.push(i);
  let count = 0, branches = 0, first = null, aborted = false;
  const solutions = [];

  function closedComponent(st) {
    const deg = new Int8Array(n);
    for (let e = 0; e < E; e++) if (st[e] === LINE) { deg[ends[e][0]]++; deg[ends[e][1]]++; }
    const seen = new Uint8Array(n);
    for (let e0 = 0; e0 < E; e0++) {
      if (st[e0] !== LINE || seen[ends[e0][0]]) continue;
      const comp = new Set(), stack = [ends[e0][0]]; seen[ends[e0][0]] = 1; let closed = true;
      while (stack.length) { const v = stack.pop(); if (deg[v] !== 2) closed = false; for (const e of cellEdges[v]) if (e >= 0 && st[e] === LINE) { comp.add(e); const w = ends[e][0] === v ? ends[e][1] : ends[e][0]; if (!seen[w]) { seen[w] = 1; stack.push(w); } } }
      if (closed && comp.size) return comp;
    }
    return null;
  }
  const set = (st, e, v) => { if (e < 0) return v === CROSS; if (st[e] === UNKNOWN) { st[e] = v; return true; } return st[e] === v; };

  function propagate(st) {
    for (;;) {
      let changed = false;
      const mark = (e, v) => { if (e < 0) { if (v === LINE) throw 0; return; } if (st[e] === UNKNOWN) { st[e] = v; changed = true; } else if (st[e] !== v) throw 0; };
      try {
        for (let i = 0; i < n; i++) {
          const es = cellEdges[i];
          let lines = 0, unk = 0;
          for (const e of es) { if (e < 0) continue; if (st[e] === LINE) lines++; else if (st[e] === UNKNOWN) unk++; }
          if (lines > 2 || (lines === 1 && unk === 0)) return false;
          if (pearls[i] && lines + unk < 2) return false;
          if (lines === 2 && unk) for (const e of es) if (e >= 0 && st[e] === UNKNOWN) mark(e, CROSS);
          if (lines === 1 && unk === 1) for (const e of es) if (e >= 0 && st[e] === UNKNOWN) mark(e, LINE);
          if (lines === 0 && unk === 1) for (const e of es) if (e >= 0 && st[e] === UNKNOWN) mark(e, CROSS);
          if (pearls[i] && lines === 0 && unk === 2) for (const e of es) if (e >= 0 && st[e] === UNKNOWN) mark(e, LINE);
        }
        for (const i of pearlCells) {
          const es = cellEdges[i];
          const val = (d) => (es[d] < 0 ? CROSS : st[es[d]]);
          const cont = (d) => { const j = step(i, d); return j < 0 ? -1 : cellEdges[j][d]; }; // edge continuing beyond neighbour in direction d
          if (pearls[i] === WHITE) {
            const hOut = val(L_) === CROSS || val(R_) === CROSS, vOut = val(U_) === CROSS || val(D_) === CROSS;
            const hIn = val(L_) === LINE || val(R_) === LINE, vIn = val(U_) === LINE || val(D_) === LINE;
            if ((hOut && vOut) || (hIn && vIn)) return false;
            let axis = hIn || vOut ? "h" : vIn || hOut ? "v" : null;
            if (axis === "h") { mark(es[L_], LINE); mark(es[R_], LINE); mark(es[U_], CROSS); mark(es[D_], CROSS); }
            if (axis === "v") { mark(es[U_], LINE); mark(es[D_], LINE); mark(es[L_], CROSS); mark(es[R_], CROSS); }
            if (axis) {
              const [d1, d2] = axis === "h" ? [L_, R_] : [U_, D_];
              const c1 = cont(d1), c2 = cont(d2);
              const s1 = c1 >= 0 ? st[c1] : CROSS, s2 = c2 >= 0 ? st[c2] : CROSS; // beyond the border counts as a turn
              if (s1 === LINE && s2 === LINE) return false;
              if (s1 === LINE) mark(c2, CROSS);
              if (s2 === LINE) mark(c1, CROSS);
            }
          } else {
            for (const [d1, d2] of [[L_, R_], [U_, D_]]) {
              const poss = (d) => es[d] >= 0 && st[es[d]] !== CROSS && cont(d) >= 0 && st[cont(d)] !== CROSS;
              const p1 = poss(d1), p2 = poss(d2);
              if (!p1 && !p2) return false;
              if (val(d1) === LINE || !p2) { mark(es[d1], LINE); mark(cont(d1), LINE); mark(es[d2], CROSS); }
              else if (val(d2) === LINE || !p1) { mark(es[d2], LINE); mark(cont(d2), LINE); mark(es[d1], CROSS); }
            }
          }
        }
        const closed = closedComponent(st);
        if (closed) {
          for (let e = 0; e < E; e++) if (st[e] === LINE && !closed.has(e)) return false;
          for (let e = 0; e < E; e++) if (st[e] === UNKNOWN) mark(e, CROSS);
        }
      } catch (x) { if (x === 0) return false; throw x; }
      if (!changed) return true;
    }
  }
  function pick(st) {
    for (const i of pearlCells) for (const e of cellEdges[i]) if (e >= 0 && st[e] === UNKNOWN) return e;
    for (let i = 0; i < n; i++) { let lines = 0, cand = -1; for (const e of cellEdges[i]) { if (e < 0) continue; if (st[e] === LINE) lines++; else if (st[e] === UNKNOWN) cand = e; } if (lines === 1 && cand >= 0) return cand; }
    for (let e = 0; e < E; e++) if (st[e] === UNKNOWN) return e;
    return -1;
  }
  function rec(st) {
    if (!propagate(st)) return false;
    const e = pick(st);
    if (e < 0) {
      let lines = 0; for (let k = 0; k < E; k++) if (st[k] === LINE) lines++;
      if (!lines) return false;
      const closed = closedComponent(st);
      if (!closed || closed.size !== lines) return false;
      for (const i of pearlCells) { let d = 0; for (const x of cellEdges[i]) if (x >= 0 && st[x] === LINE) d++; if (d !== 2) return false; }
      count++; const sol = Uint8Array.from(st, (x) => (x === LINE ? 1 : 0)); solutions.push(sol); if (!first) first = sol; return count >= limit;
    }
    if (++branches > maxBranches) { aborted = true; return true; }
    for (const v of [LINE, CROSS]) { const nx = st.slice(); nx[e] = v; if (rec(nx)) return true; }
    return false;
  }
  rec(initial ? Int8Array.from(initial) : new Int8Array(E));
  return aborted ? { count: -1, branches, solution: null, solutions: [] } : { count, branches, solution: first, solutions };
}
/** Does this full edge set (Uint8Array 0/1) satisfy every rule for these pearls? */
export function validateLoop(L, pearls, edges) {
  const st = Int8Array.from(edges, (x) => (x ? LINE : CROSS));
  return countSolutions(L, pearls, 1, 1000, st).count === 1;
}

const DENSITY_BY_BAND = { 1: 0.30, 2: 0.25, 3: 0.21, 4: 0.17, 5: 0.14 }; // pearls per cell

export function generate({ rows = 10, cols = 10, seed = 1, targetBand = null, maxAttempts = 8, maxMutations = 120, budget = 4000 } = {}) {
  const rng = new Rng(seed);
  const L = layout(rows, cols);
  const dr = rows - 1, dc = cols - 1;
  const floor = Math.round(L.n * DENSITY_BY_BAND[targetBand ?? 3]);
  let best = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let inside = randomRegion(L, rng);
    let loop = loopFromRegion(L, inside), pearls = pearlCandidates(L, loop);
    let res = countSolutions(L, pearls, 3, budget), mutations = 0;
    // Hill-climb: while a second solution exists, toggle a dual cell next to where it differs.
    while (res.count !== 1 && mutations < maxMutations) {
      mutations++;
      if (res.count <= 0) break;
      const alt = res.solutions.find((sol) => sol.some((x, i) => x !== loop[i])) || res.solutions[0];
      const near = new Set();
      for (let e = 0; e < L.E; e++) if (alt[e] !== loop[e]) for (const cell of L.ends[e]) {
        const r = Math.floor(cell / cols), c = cell % cols;
        for (const [rr, cc] of [[r - 1, c - 1], [r - 1, c], [r, c - 1], [r, c]]) if (rr >= 0 && cc >= 0 && rr < dr && cc < dc) near.add(rr * dc + cc);
      }
      const cands = rng.shuffle([...near]);
      let applied = null;
      for (const i of cands) {
        const trial = inside.slice(); trial[i] ^= 1;
        if (!regionValid(trial, dr, dc)) continue;
        const tLoop = loopFromRegion(L, trial), tPearls = pearlCandidates(L, tLoop);
        const tRes = countSolutions(L, tPearls, 3, budget);
        if (tRes.count <= 0) continue;
        if (tRes.count < res.count || (tRes.count === res.count && rng.chance(0.5))) { applied = { trial, tLoop, tPearls, tRes }; break; }
      }
      if (!applied) break;
      inside = applied.trial; loop = applied.tLoop; pearls = applied.tPearls; res = applied.tRes;
    }
    if (res.count !== 1) continue;
    const order = rng.shuffle(Array.from({ length: L.n }, (_, i) => i).filter((i) => pearls[i]));
    let remaining = order.length;
    for (const i of order) {
      if (remaining <= floor) break;
      const saved = pearls[i]; pearls[i] = NONE;
      if (countSolutions(L, pearls, 2, budget).count !== 1) pearls[i] = saved; else remaining--; // a blown budget keeps the pearl
    }
    const final = countSolutions(L, pearls, 2, budget * 4);
    // Branch counts don't track human difficulty here yet; band follows the pearl density we reduced to.
    const density = remaining / L.n;
    const band = Object.entries(DENSITY_BY_BAND).reduce((b, [k, d]) => (density <= d + 0.015 ? Math.max(b, +k) : b), 1);
    const rating = { ...provisionalRating({ branches: Math.max(0, final.branches), cells: L.n, clueDensity: density }), band, label: BAND_LABELS[band], rating_method: "provisional-pearl-density" };
    const grid = [];
    for (let r = 0; r < rows; r++) grid.push(Array.from({ length: cols }, (_, c) => [".", "o", "*"][pearls[r * cols + c]]).join(""));
    const h = [], v = [];
    for (let r = 0; r < rows; r++) h.push(Array.from({ length: cols - 1 }, (_, c) => loop[L.hIdx(r, c)]).join(""));
    for (let r = 0; r < rows - 1; r++) v.push(Array.from({ length: cols }, (_, c) => loop[L.vIdx(r, c)]).join(""));
    const puzzle = {
      id: `masyu-${rows}x${cols}-s${String(seed).padStart(6, "0")}`, type: "masyu", seed,
      params: { rows, cols, target_band: targetBand },
      difficulty: rating, clues: { grid }, solution: { h, v },
      stats: { clue_count: remaining, white: grid.join("").split("o").length - 1, black: grid.join("").split("*").length - 1, loop_cells: Array.from(loop).reduce((s, x) => s + x, 0), mutations, attempts: attempt },
    };
    if (targetBand == null || rating.band === targetBand) return puzzle;
    if (!best || Math.abs(rating.band - targetBand) < Math.abs(best.difficulty.band - targetBand)) best = puzzle;
  }
  return best;
}

export function pearlsFromPuzzle(p) {
  const { rows, cols } = p.params, out = new Int8Array(rows * cols);
  p.clues.grid.forEach((row, r) => [...row].forEach((ch, c) => (out[r * cols + c] = ch === "o" ? WHITE : ch === "*" ? BLACK : NONE)));
  return out;
}
export function solutionEdges(p, L) {
  const edges = new Uint8Array(L.E);
  p.solution.h.forEach((row, r) => [...row].forEach((ch, c) => (edges[L.hIdx(r, c)] = +ch)));
  p.solution.v.forEach((row, r) => [...row].forEach((ch, c) => (edges[L.vIdx(r, c)] = +ch)));
  return edges;
}
