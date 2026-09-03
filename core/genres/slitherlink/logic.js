// Slitherlink: generation, uniqueness oracle, validation.
// Edges: h[r][c] is the horizontal edge on top of cell (r,c), r in 0..rows, c in 0..cols-1.
//        v[r][c] is the vertical edge left of cell (r,c),   r in 0..rows-1, c in 0..cols.
// Flat edge index: h -> r*cols + c ; v -> H + r*(cols+1) + c, with H = (rows+1)*cols.
import { Rng } from "../../lib/rng.js";
import { neighbors, blocksAround, flood } from "../../lib/grid.js";
import { provisionalRating, BAND_LABELS } from "../../lib/difficulty.js";

export const UNKNOWN = 0, LINE = 1, CROSS = 2;

export function edgeLayout(rows, cols) {
  const H = (rows + 1) * cols, V = rows * (cols + 1);
  const hIdx = (r, c) => r * cols + c;
  const vIdx = (r, c) => H + r * (cols + 1) + c;
  const cellEdges = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cellEdges.push([hIdx(r, c), hIdx(r + 1, c), vIdx(r, c), vIdx(r, c + 1)]);
  const vertexEdges = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    const e = [];
    if (c > 0) e.push(hIdx(r, c - 1));
    if (c < cols) e.push(hIdx(r, c));
    if (r > 0) e.push(vIdx(r - 1, c));
    if (r < rows) e.push(vIdx(r, c));
    vertexEdges.push(e);
  }
  const ends = new Array(H + V); // vertex index = r*(cols+1)+c
  for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) ends[hIdx(r, c)] = [r * (cols + 1) + c, r * (cols + 1) + c + 1];
  for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) ends[vIdx(r, c)] = [r * (cols + 1) + c, (r + 1) * (cols + 1) + c];
  return { rows, cols, H, V, E: H + V, hIdx, vIdx, cellEdges, vertexEdges, ends };
}

// ------------------------------------------------------------------ loop generation
/** Grow a random simply-connected "inside" region whose boundary is a single loop. */
export function randomInside(rows, cols, rng, opts = {}) {
  const n = rows * cols;
  const target = Math.round(n * (opts.fill ?? rng.range(45, 60) / 100));
  const inside = new Uint8Array(n);
  const sr = Math.min(rows - 1, Math.max(0, Math.floor(rows / 2) + rng.range(-1, 1)));
  const sc = Math.min(cols - 1, Math.max(0, Math.floor(cols / 2) + rng.range(-1, 1)));
  inside[sr * cols + sc] = 1;
  let count = 1;

  const isIn = (i) => inside[i] === 1;
  const checkerboardAt = (i) => {
    for (const [a, b, c, d] of blocksAround(i, rows, cols)) {
      if (isIn(a) && isIn(d) && !isIn(b) && !isIn(c)) return true;
      if (isIn(b) && isIn(c) && !isIn(a) && !isIn(d)) return true;
    }
    return false;
  };
  const outsideConnected = () => {
    const outs = [];
    for (let i = 0; i < n; i++) if (!inside[i]) outs.push(i);
    if (!outs.length) return false;
    const border = outs.filter((i) => { const r = Math.floor(i / cols), c = i % cols; return r === 0 || c === 0 || r === rows - 1 || c === cols - 1; });
    const seen = flood(border.length ? border : [outs[0]], rows, cols, (j) => !inside[j]);
    return seen.size === outs.length;
  };
  const insideConnected = () => {
    let first = -1; for (let i = 0; i < n; i++) if (inside[i]) { first = i; break; }
    return flood(first, rows, cols, isIn).size === count;
  };

  let stale = 0;
  while (count < target && stale < 400) {
    const frontier = [];
    for (let i = 0; i < n; i++) if (!inside[i] && neighbors(i, rows, cols).some(isIn)) frontier.push(i);
    if (!frontier.length) break;
    const i = rng.pick(frontier);
    inside[i] = 1; count++;
    if (checkerboardAt(i) || !outsideConnected()) { inside[i] = 0; count--; stale++; } else stale = 0;
  }
  const erosions = opts.erode ?? Math.round(n * 0.10); // meander: erode, keeping only moves that preserve a single loop
  for (let k = 0; k < erosions; k++) {
    const cand = [];
    for (let i = 0; i < n; i++) if (inside[i] && neighbors(i, rows, cols).some((j) => !inside[j])) cand.push(i);
    if (cand.length <= 4) break;
    const i = rng.pick(cand);
    inside[i] = 0; count--;
    if (count === 0 || checkerboardAt(i) || !insideConnected() || !outsideConnected()) { inside[i] = 1; count++; }
  }
  return inside;
}

export function loopFromInside(inside, L) {
  const { rows, cols, hIdx, vIdx, E } = L;
  const isIn = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols && inside[r * cols + c] === 1;
  const edges = new Uint8Array(E);
  for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) if (isIn(r - 1, c) !== isIn(r, c)) edges[hIdx(r, c)] = 1;
  for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) if (isIn(r, c - 1) !== isIn(r, c)) edges[vIdx(r, c)] = 1;
  return edges;
}

// ------------------------------------------------------------------ oracle solver
/**
 * Count solutions up to `limit`. clues: Int8Array(rows*cols) with 0..3 or -1 for none.
 * Returns { count, branches, solution } where solution is a Uint8Array edge set (1 = line).
 */
export function countSolutions(L, clues, limit = 2) {
  const { E, cellEdges, vertexEdges, ends } = L;
  const nV = vertexEdges.length;
  let count = 0, branches = 0, firstSolution = null;
  const clueCells = [];
  for (let i = 0; i < clues.length; i++) if (clues[i] >= 0) clueCells.push(i);

  function closedComponent(st) {
    const deg = new Int8Array(nV);
    for (let e = 0; e < E; e++) if (st[e] === LINE) { deg[ends[e][0]]++; deg[ends[e][1]]++; }
    const seenV = new Uint8Array(nV);
    for (let e0 = 0; e0 < E; e0++) {
      if (st[e0] !== LINE || seenV[ends[e0][0]]) continue;
      const compEdges = new Set(), stack = [ends[e0][0]];
      let closed = true; seenV[ends[e0][0]] = 1;
      while (stack.length) {
        const v = stack.pop();
        if (deg[v] !== 2) closed = false;
        for (const e of vertexEdges[v]) if (st[e] === LINE) {
          compEdges.add(e);
          const w = ends[e][0] === v ? ends[e][1] : ends[e][0];
          if (!seenV[w]) { seenV[w] = 1; stack.push(w); }
        }
      }
      if (closed && compEdges.size) return compEdges;
    }
    return null;
  }

  function propagate(st) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let v = 0; v < nV; v++) {
        const es = vertexEdges[v];
        let lines = 0, unk = 0;
        for (const e of es) { if (st[e] === LINE) lines++; else if (st[e] === UNKNOWN) unk++; }
        if (lines > 2 || (lines === 1 && unk === 0)) return false;
        if (lines === 2 && unk) { for (const e of es) if (st[e] === UNKNOWN) st[e] = CROSS; changed = true; }
        else if (lines === 1 && unk === 1) { for (const e of es) if (st[e] === UNKNOWN) st[e] = LINE; changed = true; }
        else if (lines === 0 && unk === 1) { for (const e of es) if (st[e] === UNKNOWN) st[e] = CROSS; changed = true; }
      }
      for (const i of clueCells) {
        const es = cellEdges[i], n = clues[i];
        let lines = 0, unk = 0;
        for (const e of es) { if (st[e] === LINE) lines++; else if (st[e] === UNKNOWN) unk++; }
        if (lines > n || lines + unk < n) return false;
        if (unk && lines === n) { for (const e of es) if (st[e] === UNKNOWN) st[e] = CROSS; changed = true; }
        else if (unk && lines + unk === n) { for (const e of es) if (st[e] === UNKNOWN) st[e] = LINE; changed = true; }
      }
      const closed = closedComponent(st);
      if (closed) {
        for (let e = 0; e < E; e++) if (st[e] === LINE && !closed.has(e)) return false;
        for (let e = 0; e < E; e++) if (st[e] === UNKNOWN) { st[e] = CROSS; changed = true; }
      }
    }
    return true;
  }

  function pickEdge(st) {
    for (let v = 0; v < nV; v++) {
      let lines = 0, cand = -1;
      for (const e of vertexEdges[v]) { if (st[e] === LINE) lines++; else if (st[e] === UNKNOWN) cand = e; }
      if (lines === 1 && cand >= 0) return cand;
    }
    for (const i of clueCells) for (const e of cellEdges[i]) if (st[e] === UNKNOWN) return e;
    for (let e = 0; e < E; e++) if (st[e] === UNKNOWN) return e;
    return -1;
  }

  function rec(st) {
    if (!propagate(st)) return false;
    const e = pickEdge(st);
    if (e < 0) {
      let lines = 0; for (let k = 0; k < E; k++) if (st[k] === LINE) lines++;
      if (!lines) return false;
      const closed = closedComponent(st);
      if (!closed || closed.size !== lines) return false;
      count++;
      if (!firstSolution) firstSolution = Uint8Array.from(st, (x) => (x === LINE ? 1 : 0));
      return count >= limit;
    }
    branches++;
    for (const val of [LINE, CROSS]) {
      const next = st.slice(); next[e] = val;
      if (rec(next)) return true;
    }
    return false;
  }

  rec(new Int8Array(E));
  return { count, branches, solution: firstSolution };
}

// ------------------------------------------------------------------ generation
// Clue density to stop removing at, by target band. Nikoli-style Slitherlink keeps roughly
// 40-55% of cells clued; a minimal clue set is far harder than anything printed.
const DENSITY_BY_BAND = { 1: 0.56, 2: 0.49, 3: 0.43, 4: 0.37, 5: 0.31 };

export function generate({ rows = 8, cols = 8, seed = 1, targetBand = null, symmetric = false, maxAttempts = 12 } = {}) {
  const rng = new Rng(seed);
  const L = edgeLayout(rows, cols);
  const floor = Math.round(rows * cols * DENSITY_BY_BAND[targetBand ?? 3]);
  let best = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const inside = randomInside(rows, cols, rng);
    const loop = loopFromInside(inside, L);
    const clues = new Int8Array(rows * cols);
    for (let i = 0; i < rows * cols; i++) clues[i] = L.cellEdges[i].reduce((s, e) => s + loop[e], 0);
    const orbits = [];
    if (symmetric) {
      const seen = new Set();
      for (let i = 0; i < rows * cols; i++) { const j = rows * cols - 1 - i; if (seen.has(i)) continue; seen.add(i); seen.add(j); orbits.push(i === j ? [i] : [i, j]); }
    } else for (let i = 0; i < rows * cols; i++) orbits.push([i]);
    // Zeros read as noise on the page and are usually redundant: try removing them first.
    rng.shuffle(orbits);
    orbits.sort((a, b) => (clues[a[0]] === 0 && rng.chance(0.5) ? 0 : 1) - (clues[b[0]] === 0 && rng.chance(0.5) ? 0 : 1));
    let remaining = rows * cols;
    for (const orb of orbits) {
      if (remaining - orb.length < floor) continue;
      const saved = orb.map((i) => clues[i]);
      for (const i of orb) clues[i] = -1;
      if (countSolutions(L, clues, 2).count !== 1) orb.forEach((i, k) => (clues[i] = saved[k]));
      else remaining -= orb.length;
    }
    const final = countSolutions(L, clues, 2);
    const clueCount = clues.reduce((s, x) => s + (x >= 0 ? 1 : 0), 0);
    // The oracle has no pattern rules yet, so its branch count overstates human difficulty here.
    // Until the technique-ladder solver exists, the band is the density tier we removed clues to.
    const density = clueCount / (rows * cols);
    const band = Object.entries(DENSITY_BY_BAND).reduce((b, [k, d]) => (density <= d + 0.02 ? Math.max(b, +k) : b), 1);
    const rating = { ...provisionalRating({ branches: final.branches, cells: rows * cols, clueDensity: density }), band, label: BAND_LABELS[band], rating_method: "provisional-clue-density" };
    const puzzle = pack({ rows, cols, seed, symmetric, clues, loop, L, rating, clueCount, attempt, targetBand });
    if (targetBand == null || rating.band === targetBand) return puzzle;
    if (!best || Math.abs(rating.band - targetBand) < Math.abs(best.difficulty.band - targetBand)) best = puzzle;
  }
  return best;
}

function pack({ rows, cols, seed, symmetric, clues, loop, L, rating, clueCount, attempt, targetBand }) {
  const grid = [];
  for (let r = 0; r < rows; r++) grid.push(Array.from({ length: cols }, (_, c) => (clues[r * cols + c] >= 0 ? clues[r * cols + c] : null)));
  const h = [], v = [];
  for (let r = 0; r <= rows; r++) h.push(Array.from({ length: cols }, (_, c) => loop[L.hIdx(r, c)]).join(""));
  for (let r = 0; r < rows; r++) v.push(Array.from({ length: cols + 1 }, (_, c) => loop[L.vIdx(r, c)]).join(""));
  return {
    id: `slitherlink-${rows}x${cols}-s${String(seed).padStart(6, "0")}`,
    type: "slitherlink",
    seed,
    params: { rows, cols, symmetry: symmetric ? "rotational-180" : "none", target_band: targetBand },
    difficulty: rating,
    clues: { grid },
    solution: { h, v },
    stats: { clue_count: clueCount, attempts: attempt },
  };
}

// ------------------------------------------------------------------ helpers for UI / validation
export function cluesFromPuzzle(p) {
  const { rows, cols } = p.params, out = new Int8Array(rows * cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[r * cols + c] = p.clues.grid[r][c] == null ? -1 : p.clues.grid[r][c];
  return out;
}
export function solutionEdges(p, L) {
  const edges = new Uint8Array(L.E);
  p.solution.h.forEach((row, r) => [...row].forEach((ch, c) => (edges[L.hIdx(r, c)] = +ch)));
  p.solution.v.forEach((row, r) => [...row].forEach((ch, c) => (edges[L.vIdx(r, c)] = +ch)));
  return edges;
}
