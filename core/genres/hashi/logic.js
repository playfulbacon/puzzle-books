// Hashiwokakero (Bridges): connect numbered islands with 1 or 2 straight bridges; no crossings,
// every island's bridge count equals its number, and all islands end up connected.
import { Rng } from "../../lib/rng.js";
import { provisionalRating } from "../../lib/difficulty.js";

/** Build candidate edges between aligned islands with nothing between them. */
export function buildEdges(rows, cols, islands) {
  const at = new Int16Array(rows * cols).fill(-1);
  islands.forEach(([r, c], k) => (at[r * cols + c] = k));
  const edges = [];
  islands.forEach(([r, c], k) => {
    for (let cc = c + 1; cc < cols; cc++) { const j = at[r * cols + cc]; if (j >= 0) { const cells = []; for (let x = c + 1; x < cc; x++) cells.push(r * cols + x); edges.push({ a: k, b: j, cells, horiz: true }); break; } }
    for (let rr = r + 1; rr < rows; rr++) { const j = at[rr * cols + c]; if (j >= 0) { const cells = []; for (let y = r + 1; y < rr; y++) cells.push(y * cols + c); edges.push({ a: k, b: j, cells, horiz: false }); break; } }
  });
  const byCell = new Map();
  edges.forEach((e, idx) => { for (const x of e.cells) { if (!byCell.has(x)) byCell.set(x, []); byCell.get(x).push(idx); } });
  edges.forEach((e, idx) => { const cross = new Set(); for (const x of e.cells) for (const o of byCell.get(x)) if (o !== idx && edges[o].horiz !== e.horiz) cross.add(o); e.cross = [...cross]; });
  const islandEdges = islands.map(() => []);
  edges.forEach((e, idx) => { islandEdges[e.a].push(idx); islandEdges[e.b].push(idx); });
  return { edges, islandEdges, at };
}

/** islands: [[r,c,n],...]. Returns { count, branches, solution: Int8Array(edges) }. */
export function countSolutions(rows, cols, islands, limit = 2, maxBranches = 100000) {
  const { edges, islandEdges } = buildEdges(rows, cols, islands);
  const E = edges.length, K = islands.length;
  let count = 0, branches = 0, first = null, aborted = false;
  const other = (e, k) => (edges[e].a === k ? edges[e].b : edges[e].a);

  function connectedThrough(st, allowUnknown) {
    const seen = new Uint8Array(K), stack = [0]; seen[0] = 1; let cnt = 1;
    while (stack.length) { const k = stack.pop(); for (const e of islandEdges[k]) { if (st[e] > 0 || (allowUnknown && st[e] < 0)) { const j = other(e, k); if (!seen[j]) { seen[j] = 1; cnt++; stack.push(j); } } } }
    return cnt === K;
  }
  function propagate(st) {
    for (;;) {
      let changed = false;
      for (let k = 0; k < K; k++) {
        const need = islands[k][2];
        let have = 0, unk = [];
        for (const e of islandEdges[k]) { if (st[e] > 0) have += st[e]; else if (st[e] < 0) unk.push(e); }
        if (have > need || have + 2 * unk.length < need) return false;
        if (unk.length && have === need) { for (const e of unk) { st[e] = 0; changed = true; } }
        else if (unk.length && have + 2 * unk.length === need) { for (const e of unk) { st[e] = 2; changed = true; } }
        else if (unk.length === 1) { const v = need - have; if (v < 1 || v > 2) return false; st[unk[0]] = v; changed = true; }
      }
      for (let e = 0; e < E; e++) if (st[e] > 0) for (const o of edges[e].cross) { if (st[o] > 0) return false; if (st[o] < 0) { st[o] = 0; changed = true; } }
      if (!changed) break;
    }
    if (!connectedThrough(st, true)) return false;
    // A saturated component that doesn't include everyone can never connect.
    const seen = new Uint8Array(K);
    for (let s = 0; s < K; s++) {
      if (seen[s]) continue;
      const comp = [s]; seen[s] = 1;
      for (let q = 0; q < comp.length; q++) for (const e of islandEdges[comp[q]]) if (st[e] > 0) { const j = other(e, comp[q]); if (!seen[j]) { seen[j] = 1; comp.push(j); } }
      if (comp.length === K) break;
      let open = false;
      for (const k of comp) { let have = 0, unk = false; for (const e of islandEdges[k]) { if (st[e] > 0) have += st[e]; else if (st[e] < 0) unk = true; } if (have < islands[k][2] && unk) { open = true; break; } }
      if (!open) return false;
    }
    return true;
  }
  function pick(st) {
    let best = -1, bestSlack = 99;
    for (let k = 0; k < K; k++) {
      let have = 0, cand = -1, unk = 0;
      for (const e of islandEdges[k]) { if (st[e] > 0) have += st[e]; else if (st[e] < 0) { unk++; cand = e; } }
      if (unk && unk < bestSlack) { bestSlack = unk; best = cand; }
    }
    return best;
  }
  function rec(st) {
    if (!propagate(st)) return false;
    const e = pick(st);
    if (e < 0) {
      if (!connectedThrough(st, false)) return false;
      count++; if (!first) first = Int8Array.from(st); return count >= limit;
    }
    if (++branches > maxBranches) { aborted = true; return true; }
    for (const v of [1, 2, 0]) { const nx = st.slice(); nx[e] = v; if (rec(nx)) return true; }
    return false;
  }
  rec(new Int8Array(E).fill(-1));
  return aborted ? { count: -1, branches, solution: null, edges } : { count, branches, solution: first, edges };
}

/** Random connected island layout with a bridge tree plus extra bridges. */
export function randomStructure(rows, cols, rng, { targetIslands }) {
  const occ = new Int8Array(rows * cols); // 0 free, 1 island, 2 bridge
  const islands = [], bridges = []; // bridges: [a, b, n]
  const deg = [];
  const r0 = rng.int(rows), c0 = rng.int(cols);
  islands.push([r0, c0]); occ[r0 * cols + c0] = 1; deg.push(0);
  let stale = 0;
  while (islands.length < targetIslands && stale < 400) {
    const a = rng.int(islands.length);
    if (deg[a] >= 7) { stale++; continue; }
    const [r, c] = islands[a];
    const [dr, dc] = rng.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]);
    const d = rng.range(2, Math.max(2, Math.min(5, Math.floor(Math.max(rows, cols) / 2))));
    const rr = r + dr * d, cc = c + dc * d;
    if (rr < 0 || cc < 0 || rr >= rows || cc >= cols || occ[rr * cols + cc]) { stale++; continue; }
    let clear = true;
    for (let s = 1; s < d; s++) if (occ[(r + dr * s) * cols + c + dc * s]) { clear = false; break; }
    // the new island must not sit next to another island in a way that blocks nothing; also keep it off bridge paths (occ checked)
    if (!clear) { stale++; continue; }
    for (let s = 1; s < d; s++) occ[(r + dr * s) * cols + c + dc * s] = 2;
    occ[rr * cols + cc] = 1; islands.push([rr, cc]); deg.push(0);
    const n = rng.chance(0.3) ? 2 : 1;
    bridges.push([a, islands.length - 1, n]); deg[a] += n; deg[islands.length - 1] += n;
    stale = 0;
  }
  // Extra bridges between aligned islands with a clear path.
  const { edges } = buildEdges(rows, cols, islands);
  const has = new Set(bridges.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  for (const e of rng.shuffle(edges.slice())) {
    const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
    if (has.has(key) || !rng.chance(0.45)) continue;
    if (e.cells.some((x) => occ[x] !== 0)) continue;
    const n = rng.chance(0.35) ? 2 : 1;
    if (deg[e.a] + n > 8 || deg[e.b] + n > 8) continue;
    for (const x of e.cells) occ[x] = 2;
    bridges.push([e.a, e.b, n]); deg[e.a] += n; deg[e.b] += n; has.add(key);
  }
  return { islands: islands.map(([r, c], k) => [r, c, deg[k]]), bridges };
}

export function generate({ rows = 10, cols = 10, seed = 1, targetBand = null, maxAttempts = 60 } = {}) {
  const rng = new Rng(seed);
  let best = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const target = Math.round(rows * cols / rng.range(4, 6));
    const S = randomStructure(rows, cols, rng, { targetIslands: target });
    if (S.islands.length < target * 0.7) continue;
    const res = countSolutions(rows, cols, S.islands, 2);
    if (res.count !== 1) continue;
    const rating = provisionalRating({ branches: res.branches, cells: rows * cols, clueDensity: S.islands.length / (rows * cols) * 2 });
    const { edges } = res;
    const bridges = [];
    edges.forEach((e, idx) => { if (res.solution[idx] > 0) bridges.push([e.a, e.b, res.solution[idx]]); });
    const puzzle = {
      id: `hashi-${rows}x${cols}-s${String(seed).padStart(6, "0")}`, type: "hashi", seed,
      params: { rows, cols, target_band: targetBand },
      difficulty: rating, clues: { islands: S.islands }, solution: { bridges },
      stats: { clue_count: S.islands.length, attempts: attempt, doubles: bridges.filter((b) => b[2] === 2).length },
    };
    if (targetBand == null || rating.band === targetBand) return puzzle;
    if (!best || Math.abs(rating.band - targetBand) < Math.abs(best.difficulty.band - targetBand)) best = puzzle;
  }
  return best;
}

/** Validate a bridge assignment (Int8Array over candidate edges, -1 unknown/0/1/2). */
export function validate(p, st) {
  const { rows, cols } = p.params, islands = p.clues.islands;
  const { edges, islandEdges } = buildEdges(rows, cols, islands);
  for (let e = 0; e < edges.length; e++) if (st[e] > 0) for (const o of edges[e].cross) if (st[o] > 0) return { ok: false, reason: "crossing bridges" };
  let complete = true;
  for (let k = 0; k < islands.length; k++) {
    let have = 0, unk = false;
    for (const e of islandEdges[k]) { if (st[e] > 0) have += st[e]; else if (st[e] < 0) unk = true; }
    if (have > islands[k][2]) return { ok: false, reason: `island ${islands[k][2]} has too many bridges` };
    if (have < islands[k][2]) complete = false;
    if (unk) complete = false;
  }
  if (complete) {
    const seen = new Uint8Array(islands.length), stack = [0]; seen[0] = 1; let cnt = 1;
    while (stack.length) { const k = stack.pop(); for (const e of islandEdges[k]) if (st[e] > 0) { const j = edges[e].a === k ? edges[e].b : edges[e].a; if (!seen[j]) { seen[j] = 1; cnt++; stack.push(j); } } }
    if (cnt !== islands.length) return { ok: false, reason: "not all islands connected" };
  }
  return { ok: true, complete };
}
export function solutionState(p) {
  const { rows, cols } = p.params, { edges } = buildEdges(rows, cols, p.clues.islands);
  const st = new Int8Array(edges.length);
  for (const [a, b, n] of p.solution.bridges) { const e = edges.findIndex((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); if (e >= 0) st[e] = n; }
  return st;
}
