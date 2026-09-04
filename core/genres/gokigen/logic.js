// Gokigen Naname (Slant): every cell gets one diagonal; vertex numbers count touching diagonals;
// the diagonals may not form a loop. Cell value 0 = "\" (backslash), 1 = "/" (slash).
import { Rng } from "../../lib/rng.js";
import { provisionalRating, BAND_LABELS } from "../../lib/difficulty.js";

export const BACK = 0, FWD = 1;

export function layout(rows, cols) {
  const VC = cols + 1, nV = (rows + 1) * VC, n = rows * cols;
  const vIdx = (r, c) => r * VC + c;
  // endpoints per cell per option
  const ends = new Array(n);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ends[r * cols + c] = [[vIdx(r, c), vIdx(r + 1, c + 1)], [vIdx(r, c + 1), vIdx(r + 1, c)]];
  // cells touching each vertex, with the option that touches it
  const vertexCells = Array.from({ length: nV }, () => []);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    vertexCells[vIdx(r, c)].push([i, BACK]); vertexCells[vIdx(r + 1, c + 1)].push([i, BACK]);
    vertexCells[vIdx(r, c + 1)].push([i, FWD]); vertexCells[vIdx(r + 1, c)].push([i, FWD]);
  }
  return { rows, cols, n, nV, VC, vIdx, ends, vertexCells };
}

class UF {
  constructor(n) { this.p = new Int32Array(n); for (let i = 0; i < n; i++) this.p[i] = i; }
  find(x) { const p = this.p; while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }
  union(a, b) { a = this.find(a); b = this.find(b); if (a === b) return false; this.p[a] = b; return true; }
}

/** Random acyclic full assignment via randomized backtracking. */
export function randomSolution(L, rng) {
  const order = rng.shuffle(Array.from({ length: L.n }, (_, i) => i));
  const cells = new Int8Array(L.n).fill(-1);
  const uf = new UF(L.nV);
  const rec = (k) => {
    if (k === L.n) return true;
    const i = order[k];
    const opts = rng.chance(0.5) ? [BACK, FWD] : [FWD, BACK];
    for (const d of opts) {
      const [a, b] = L.ends[i][d];
      if (uf.find(a) === uf.find(b)) continue;
      const saved = uf.p.slice();
      uf.union(a, b); cells[i] = d;
      if (rec(k + 1)) return true;
      uf.p.set(saved); cells[i] = -1;
    }
    return false;
  };
  rec(0);
  return cells;
}

/** clues: Int8Array(nV), -1 none, else 0..4. Returns { count, branches, solution }. */
export function countSolutions(L, clues, limit = 2, maxBranches = 100000) {
  const { n, nV, ends, vertexCells } = L;
  const clueV = []; for (let v = 0; v < nV; v++) if (clues[v] >= 0) clueV.push(v);
  let count = 0, branches = 0, first = null, aborted = false;

  function propagate(st) {
    for (;;) {
      let changed = false;
      const uf = new UF(nV);
      for (let i = 0; i < n; i++) if (st[i] >= 0) { const [a, b] = ends[i][st[i]]; if (!uf.union(a, b)) return false; }
      for (let i = 0; i < n; i++) {
        if (st[i] >= 0) continue;
        const cyc0 = uf.find(ends[i][0][0]) === uf.find(ends[i][0][1]);
        const cyc1 = uf.find(ends[i][1][0]) === uf.find(ends[i][1][1]);
        if (cyc0 && cyc1) return false;
        if (cyc0) { st[i] = FWD; uf.union(...ends[i][FWD]); changed = true; }
        else if (cyc1) { st[i] = BACK; uf.union(...ends[i][BACK]); changed = true; }
      }
      for (const v of clueV) {
        let lines = 0, unk = 0;
        for (const [i, d] of vertexCells[v]) { if (st[i] === d) lines++; else if (st[i] < 0) unk++; }
        const need = clues[v];
        if (lines > need || lines + unk < need) return false;
        if (unk && lines === need) { for (const [i, d] of vertexCells[v]) if (st[i] < 0) { st[i] = 1 - d; changed = true; } }
        else if (unk && lines + unk === need) { for (const [i, d] of vertexCells[v]) if (st[i] < 0) { st[i] = d; changed = true; } }
      }
      if (!changed) return true;
    }
  }
  function pick(st) {
    let best = -1, bestSlack = 99;
    for (const v of clueV) {
      let lines = 0, unk = 0, cand = -1;
      for (const [i] of vertexCells[v]) { if (st[i] < 0) { unk++; cand = i; } }
      for (const [i, d] of vertexCells[v]) if (st[i] === d) lines++;
      if (unk && unk < bestSlack) { bestSlack = unk; best = cand; }
    }
    if (best >= 0) return best;
    for (let i = 0; i < n; i++) if (st[i] < 0) return i;
    return -1;
  }
  function rec(st) {
    if (!propagate(st)) return false;
    const i = pick(st);
    if (i < 0) { count++; if (!first) first = Int8Array.from(st); return count >= limit; }
    if (++branches > maxBranches) { aborted = true; return true; }
    for (const d of [BACK, FWD]) { const nx = st.slice(); nx[i] = d; if (rec(nx)) return true; }
    return false;
  }
  rec(new Int8Array(n).fill(-1));
  return aborted ? { count: -1, branches, solution: null } : { count, branches, solution: first };
}

const DENSITY_BY_BAND = { 1: 0.50, 2: 0.42, 3: 0.35, 4: 0.29, 5: 0.24 }; // fraction of vertices clued

export function generate({ rows = 10, cols = 10, seed = 1, targetBand = null, symmetric = true, maxAttempts = 10 } = {}) {
  const rng = new Rng(seed);
  const L = layout(rows, cols);
  const floor = Math.round(L.nV * DENSITY_BY_BAND[targetBand ?? 3]);
  let best = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const sol = randomSolution(L, rng);
    const clues = new Int8Array(L.nV);
    for (let v = 0; v < L.nV; v++) { let k = 0; for (const [i, d] of L.vertexCells[v]) if (sol[i] === d) k++; clues[v] = k; }
    const orbits = [];
    if (symmetric) { const seen = new Set(); for (let v = 0; v < L.nV; v++) { const w = L.nV - 1 - v; if (seen.has(v)) continue; seen.add(v); seen.add(w); orbits.push(v === w ? [v] : [v, w]); } }
    else for (let v = 0; v < L.nV; v++) orbits.push([v]);
    rng.shuffle(orbits);
    let remaining = L.nV;
    for (const orb of orbits) {
      if (remaining - orb.length < floor) continue;
      const saved = orb.map((v) => clues[v]);
      for (const v of orb) clues[v] = -1;
      if (countSolutions(L, clues, 2).count !== 1) orb.forEach((v, k) => (clues[v] = saved[k]));
      else remaining -= orb.length;
    }
    const final = countSolutions(L, clues, 2);
    const density = remaining / L.nV;
    const rating = provisionalRating({ branches: final.branches, cells: L.n, clueDensity: density });
    const grid = [];
    for (let r = 0; r <= rows; r++) grid.push(Array.from({ length: cols + 1 }, (_, c) => (clues[L.vIdx(r, c)] >= 0 ? clues[L.vIdx(r, c)] : null)));
    const cells = [];
    for (let r = 0; r < rows; r++) cells.push(Array.from({ length: cols }, (_, c) => (sol[r * cols + c] === FWD ? "/" : "\\")).join(""));
    const puzzle = {
      id: `gokigen-${rows}x${cols}-s${String(seed).padStart(6, "0")}`, type: "gokigen", seed,
      params: { rows, cols, symmetry: symmetric ? "rotational-180" : "none", target_band: targetBand },
      difficulty: rating, clues: { vertices: grid }, solution: { cells },
      stats: { clue_count: remaining, attempts: attempt },
    };
    if (targetBand == null || rating.band === targetBand) return puzzle;
    if (!best || Math.abs(rating.band - targetBand) < Math.abs(best.difficulty.band - targetBand)) best = puzzle;
  }
  return best;
}

export function cluesFromPuzzle(p) {
  const { rows, cols } = p.params, L = layout(rows, cols), out = new Int8Array(L.nV).fill(-1);
  p.clues.vertices.forEach((row, r) => row.forEach((x, c) => { if (x != null) out[L.vIdx(r, c)] = x; }));
  return out;
}
export function solutionCells(p) {
  const { rows, cols } = p.params, out = new Int8Array(rows * cols);
  p.solution.cells.forEach((row, r) => [...row].forEach((ch, c) => (out[r * cols + c] = ch === "/" ? FWD : BACK)));
  return out;
}
/** Validate a full assignment (Int8Array, -1 allowed = incomplete). */
export function validate(p, cells) {
  const { rows, cols } = p.params, L = layout(rows, cols), clues = cluesFromPuzzle(p);
  const uf = new UF(L.nV);
  for (let i = 0; i < L.n; i++) if (cells[i] >= 0 && !uf.union(...L.ends[i][cells[i]])) return { ok: false, reason: "loop" };
  let complete = true;
  for (let v = 0; v < L.nV; v++) {
    if (clues[v] < 0) continue;
    let lines = 0, unk = 0; for (const [i, d] of L.vertexCells[v]) { if (cells[i] === d) lines++; else if (cells[i] < 0) unk++; }
    if (lines > clues[v] || lines + unk < clues[v]) return { ok: false, reason: "number" };
    if (unk) complete = false;
  }
  for (let i = 0; i < L.n; i++) if (cells[i] < 0) complete = false;
  return { ok: true, complete };
}
