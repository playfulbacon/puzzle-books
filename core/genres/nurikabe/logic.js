// Nurikabe: island/sea structure generation, clue placement, uniqueness oracle.
import { Rng } from "../../lib/rng.js";
import { neighbors, components, flood } from "../../lib/grid.js";
import { provisionalRating } from "../../lib/difficulty.js";

export const UNKNOWN = 0, WHITE = 1, BLACK = 2;

// ------------------------------------------------------------------ structure generation
/**
 * Random island/sea structure. Seeds islands, grows them to target sizes, then breaks every
 * remaining 2x2 sea block by extending an adjacent island (or planting a 1-cell island), keeping
 * the sea connected throughout. Returns { owner: Int16Array (-1 sea, k island), K } or null.
 */
export function randomStructure(rows, cols, rng, { islands, maxIsland = 7 } = {}) {
  const n = rows * cols;
  const owner = new Int16Array(n).fill(-1);
  const seeds = [];
  for (let k = 0; k < islands; k++) {
    for (let t = 0; t < 200; t++) {
      const i = rng.int(n), r = Math.floor(i / cols), c = i % cols;
      if (seeds.every((s) => Math.max(Math.abs(Math.floor(s / cols) - r), Math.abs((s % cols) - c)) >= 2)) { seeds.push(i); owner[i] = k; break; }
    }
  }
  let K = seeds.length;
  const size = seeds.map(() => 1);
  const target = seeds.map(() => rng.pick([1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 7].filter((x) => x <= maxIsland)));
  const seaConnectedWithout = (i) => {
    let first = -1; for (let j = 0; j < n; j++) if (owner[j] === -1 && j !== i) { first = j; break; }
    if (first < 0) return false;
    const seen = flood(first, rows, cols, (j) => owner[j] === -1 && j !== i);
    let seaCount = 0; for (let j = 0; j < n; j++) if (owner[j] === -1 && j !== i) seaCount++;
    return seen.size === seaCount;
  };
  const adjIslands = (j) => new Set(neighbors(j, rows, cols).map((x) => owner[x]).filter((k) => k >= 0));
  const claim = (j, k) => { // sea cell j joins island k (k = -2 means new island); checks adjacency + sea connectivity
    const adj = adjIslands(j);
    if (k === -2 ? adj.size !== 0 : !(adj.size === 1 && adj.has(k))) return false;
    if (!seaConnectedWithout(j)) return false;
    if (k === -2) { owner[j] = K; size.push(1); target.push(1); K++; } else { owner[j] = k; size[k]++; }
    return true;
  };
  // Phase 1: grow seeded islands toward their targets.
  for (let step = 0; step < n * 6; step++) {
    const k = rng.int(K);
    if (size[k] >= target[k]) continue;
    const cand = [];
    for (let i = 0; i < n; i++) if (owner[i] === k) for (const j of neighbors(i, rows, cols)) if (owner[j] === -1) cand.push(j);
    rng.shuffle(cand);
    let grown = false;
    for (const j of cand) if (claim(j, k)) { grown = true; break; }
    if (!grown) target[k] = size[k];
  }
  // Phase 2: break every 2x2 sea block.
  for (let pass = 0; pass < n; pass++) {
    const blocks = [];
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, blk = [a, a + 1, a + cols, a + cols + 1];
      if (blk.every((i) => owner[i] === -1)) blocks.push(blk);
    }
    if (!blocks.length) break;
    const blk = rng.pick(blocks);
    let fixed = false;
    // Prefer extending a small adjacent island; then a new 1-cell island; then any adjacent island.
    const options = [];
    for (const j of blk) {
      const adj = adjIslands(j);
      if (adj.size === 1) { const k = [...adj][0]; options.push({ j, k, score: size[k] < maxIsland ? size[k] : 100 + size[k] }); }
      else if (adj.size === 0) options.push({ j, k: -2, score: 50 });
    }
    rng.shuffle(options); options.sort((a, b) => a.score - b.score);
    for (const o of options) if (claim(o.j, o.k)) { fixed = true; break; }
    if (!fixed) return null;
  }
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c; if (owner[a] === -1 && owner[a + 1] === -1 && owner[a + cols] === -1 && owner[a + cols + 1] === -1) return null; }
  if (components(rows, cols, (i) => owner[i] === -1).length !== 1) return null;
  return { owner, K };
}

// ------------------------------------------------------------------ oracle solver
/** clues: Int16Array(rows*cols), 0 = none. Returns { count, branches, solution: Uint8Array (1 = black) }. */
export function countSolutions(rows, cols, clues, limit = 2, maxBranches = 200000) {
  const n = rows * cols;
  let aborted = false;
  let totalWhite = 0; for (let i = 0; i < n; i++) totalWhite += clues[i];
  const totalBlack = n - totalWhite;
  const nb = []; for (let i = 0; i < n; i++) nb.push(neighbors(i, rows, cols));
  const blocks = []; for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c; blocks.push([a, a + 1, a + cols, a + cols + 1]); }
  let count = 0, branches = 0;
  const solutions = [];

  function analyse(st) {
    // White components with their clue, size, and unknown frontier.
    const comp = new Int16Array(n).fill(-1), comps = [];
    for (let i = 0; i < n; i++) {
      if (st[i] !== WHITE || comp[i] >= 0) continue;
      const cells = [i]; comp[i] = comps.length;
      for (let k = 0; k < cells.length; k++) for (const j of nb[cells[k]]) if (st[j] === WHITE && comp[j] < 0) { comp[j] = comps.length; cells.push(j); }
      let clue = 0, clueCells = 0;
      for (const x of cells) if (clues[x]) { clue = clues[x]; clueCells++; }
      const frontier = new Set(); for (const x of cells) for (const j of nb[x]) if (st[j] === UNKNOWN) frontier.add(j);
      comps.push({ cells, clue, clueCells, frontier: [...frontier] });
    }
    return { comp, comps };
  }

  function propagate(st) {
    for (;;) {
      let changed = false;
      let whites = 0, blacks = 0;
      for (let i = 0; i < n; i++) { if (st[i] === WHITE) whites++; else if (st[i] === BLACK) blacks++; }
      if (whites > totalWhite || blacks > totalBlack) return false;
      if (n - blacks < totalWhite || n - whites < totalBlack) return false;
      for (const b of blocks) {
        let bl = 0, unk = -1;
        for (const i of b) { if (st[i] === BLACK) bl++; else if (st[i] === UNKNOWN) unk = i; }
        if (bl === 4) return false;
        if (bl === 3 && unk >= 0) { st[unk] = WHITE; changed = true; }
      }
      const { comp, comps } = analyse(st);
      for (const cpt of comps) {
        if (cpt.clueCells > 1) return false;
        if (cpt.clue) {
          if (cpt.cells.length > cpt.clue) return false;
          if (cpt.cells.length === cpt.clue) { for (const j of cpt.frontier) { st[j] = BLACK; changed = true; } }
          else if (!cpt.frontier.length) return false;
          else if (cpt.frontier.length === 1) { st[cpt.frontier[0]] = WHITE; changed = true; }
        } else if (!cpt.frontier.length) return false;
        else if (cpt.frontier.length === 1) { st[cpt.frontier[0]] = WHITE; changed = true; }
      }
      if (changed) continue;
      // Unknown cell touching two different numbered islands must be black.
      for (let i = 0; i < n; i++) {
        if (st[i] !== UNKNOWN) continue;
        const seen = new Set();
        for (const j of nb[i]) if (st[j] === WHITE && comps[comp[j]].clue) seen.add(comp[j]);
        if (seen.size >= 2) { st[i] = BLACK; changed = true; }
      }
      // Reachability: unknown cells no incomplete island can reach (within remaining capacity) are black.
      const reach = new Uint8Array(n);
      const orphanReached = new Uint8Array(comps.length);
      for (let ci = 0; ci < comps.length; ci++) {
        const cpt = comps[ci];
        if (!cpt.clue || cpt.cells.length >= cpt.clue) continue;
        const cap = cpt.clue - cpt.cells.length;
        const dist = new Int16Array(n).fill(-1), q = [];
        let reachable = 0;
        for (const x of cpt.cells) { dist[x] = 0; q.push(x); }
        for (let h = 0; h < q.length; h++) {
          const x = q[h];
          if (dist[x] >= cap) continue;
          for (const j of nb[x]) {
            if (dist[j] >= 0) continue;
            if (st[j] === UNKNOWN) { // cannot pass through cells adjacent to another numbered island
              let blocked = false; for (const z of nb[j]) if (st[z] === WHITE && comp[z] !== ci && comps[comp[z]].clue) { blocked = true; break; }
              if (blocked) continue;
              dist[j] = dist[x] + 1; reach[j] = 1; reachable++; q.push(j);
            } else if (st[j] === WHITE && comp[j] !== ci && !comps[comp[j]].clue) {
              const other = comps[comp[j]]; // absorbing an unnumbered white component costs its size
              if (dist[x] + other.cells.length <= cap) { orphanReached[comp[j]] = 1; reachable += other.cells.length; for (const y of other.cells) if (dist[y] < 0) { dist[y] = dist[x] + other.cells.length; q.push(y); } }
            }
          }
        }
        if (reachable < cap) return false; // island can never reach its size
      }
      for (let ci = 0; ci < comps.length; ci++) if (!comps[ci].clue && !orphanReached[ci]) return false; // stranded white cells
      for (let i = 0; i < n; i++) if (st[i] === UNKNOWN && !reach[i]) { st[i] = BLACK; changed = true; }
      // Pockets: a component of non-white cells that holds no black cell can never join the sea, so it is white.
      const pockets = components(rows, cols, (i) => st[i] !== WHITE);
      if (pockets.length > 1) {
        let withBlack = 0; for (const pk of pockets) if (pk.some((i) => st[i] === BLACK)) withBlack++;
        if (withBlack > 1) return false;
        if (withBlack === 1) for (const pk of pockets) if (!pk.some((i) => st[i] === BLACK)) for (const i of pk) { st[i] = WHITE; changed = true; }
      }
      // Black connectivity through black ∪ unknown.
      let firstBlack = -1; for (let i = 0; i < n; i++) if (st[i] === BLACK) { firstBlack = i; break; }
      if (firstBlack >= 0) {
        const seen = flood(firstBlack, rows, cols, (j) => st[j] !== WHITE);
        for (let i = 0; i < n; i++) if (st[i] === BLACK && !seen.has(i)) return false;
        // An unknown cell whose removal splits the sea must itself be sea.
        if (!changed && blacks < totalBlack) {
          for (let u = 0; u < n; u++) {
            if (st[u] !== UNKNOWN) continue;
            let touching = 0; for (const j of nb[u]) if (st[j] !== WHITE) touching++;
            if (touching < 2) continue;
            const from = firstBlack === u ? -1 : firstBlack;
            if (from < 0) continue;
            const reach = flood(from, rows, cols, (j) => st[j] !== WHITE && j !== u);
            let cut = false; for (let i = 0; i < n; i++) if (st[i] === BLACK && !reach.has(i)) { cut = true; break; }
            if (cut) { st[u] = BLACK; changed = true; }
          }
        }
      }
      if (!changed) return true;
    }
  }

  function leafValid(st) {
    for (const b of blocks) if (b.every((i) => st[i] === BLACK)) return false;
    const { comps } = analyse(st);
    for (const cpt of comps) if (cpt.clueCells !== 1 || cpt.cells.length !== cpt.clue) return false;
    let fb = -1, blacks = 0; for (let i = 0; i < n; i++) if (st[i] === BLACK) { blacks++; if (fb < 0) fb = i; }
    if (blacks && flood(fb, rows, cols, (j) => st[j] === BLACK).size !== blacks) return false;
    return true;
  }

  function pick(st) {
    const { comp, comps } = analyse(st);
    let best = -1, bestCap = 1e9;
    for (const cpt of comps) {
      if (!cpt.clue || cpt.cells.length >= cpt.clue) continue;
      const cap = cpt.clue - cpt.cells.length;
      if (cap < bestCap && cpt.frontier.length) { bestCap = cap; best = cpt.frontier[0]; }
    }
    if (best >= 0) return best;
    for (let i = 0; i < n; i++) if (st[i] === UNKNOWN && nb[i].some((j) => st[j] === WHITE)) return i;
    for (let i = 0; i < n; i++) if (st[i] === UNKNOWN) return i;
    return -1;
  }

  function rec(st) {
    if (!propagate(st)) return false;
    const i = pick(st);
    if (i < 0) {
      if (!leafValid(st)) return false;
      count++;
      solutions.push(Uint8Array.from(st, (x) => (x === BLACK ? 1 : 0)));
      return count >= limit;
    }
    if (++branches > maxBranches) { aborted = true; return true; }
    for (const val of [WHITE, BLACK]) {
      const next = st.slice(); next[i] = val;
      if (rec(next)) return true;
    }
    return false;
  }

  const start = new Int8Array(n);
  for (let i = 0; i < n; i++) if (clues[i]) start[i] = WHITE;
  rec(start);
  if (aborted) return { count: -1, branches, solution: null, solutions: [], aborted: true };
  return { count, branches, solution: solutions[0] || null, solutions };
}

// ------------------------------------------------------------------ generation
/**
 * Solve-and-patch: place one clue per island, then while a second solution exists, take a cell that
 * is white in the intended solution but black in the alternative and move its island's clue there.
 * The intended solution stays valid; the alternative dies. Repeats until unique or out of patience.
 */
export function generate({ rows = 10, cols = 10, seed = 1, targetBand = null, maxAttempts = 30, maxPatches = 160, maxPlants = 14, branchBudget = 20000, cellsPerIsland = null, maxIsland = null, log = null } = {}) {
  const rng = new Rng(seed);
  const n = rows * cols;
  let best = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const islands = Math.round(n / (cellsPerIsland ?? rng.range(8, 10)));
    const S = randomStructure(rows, cols, rng, { islands, maxIsland: maxIsland ?? (rows >= 10 ? 7 : 6) });
    if (!S) continue;
    const cellsOf = Array.from({ length: S.K }, () => []);
    for (let i = 0; i < n; i++) if (S.owner[i] >= 0) cellsOf[S.owner[i]].push(i);
    const clueAt = cellsOf.map((cells) => rng.pick(cells));
    const clues = new Int16Array(n);
    clueAt.forEach((i, k) => (clues[i] = cellsOf[k].length));
    const intended = Uint8Array.from(S.owner, (o) => (o === -1 ? 1 : 0));
    let res = null, patches = 0, plants = 0;
    const visited = cellsOf.map((_, k) => new Set([clueAt[k]])); // clue positions already tried per island
    const seaConnectedWithout = (i) => {
      let first = -1; for (let j = 0; j < n; j++) if (intended[j] && j !== i) { first = j; break; }
      const seen = flood(first, rows, cols, (j) => intended[j] === 1 && j !== i);
      let cnt = 0; for (let j = 0; j < n; j++) if (intended[j] && j !== i) cnt++;
      return seen.size === cnt;
    };
    for (; patches <= maxPatches; patches++) {
      const t0 = Date.now();
      res = countSolutions(rows, cols, clues, 2, branchBudget);
      if (log) log({ attempt, patches, count: res.count, branches: res.branches, ms: Date.now() - t0, islands: S.K });
      if (res.count === 1) break;
      if (res.count <= 0) { res = null; break; }
      const alt = res.solutions.find((sol) => sol.some((x, i) => x !== intended[i]));
      if (!alt) { res = null; break; }
      // Patch A: plant a 1-cell island on a sea cell the alternative wants white (kills it outright).
      // Patch B: move an island's clue onto a cell the alternative shades.
      const plantable = [], movable = [];
      for (let i = 0; i < n; i++) {
        if (intended[i] && !alt[i] && neighbors(i, rows, cols).every((j) => S.owner[j] === -1) && seaConnectedWithout(i)) plantable.push(i);
        if (!intended[i] && alt[i] && S.owner[i] >= 0 && clueAt[S.owner[i]] !== i) movable.push(i);
      }
      // Planting never undoes an earlier patch; moving can. Prefer plants (within the cap), then
      // moves to clue positions not tried before, then any move.
      const fresh = movable.filter((i) => !visited[S.owner[i]].has(i));
      if (fresh.length) movable.splice(0, movable.length, ...fresh);
      const plant = plantable.length && plants < maxPlants && (!movable.length || rng.chance(0.7));
      if (plant) {
        const x = rng.pick(plantable);
        intended[x] = 0; S.owner[x] = S.K; cellsOf.push([x]); clueAt.push(x); visited.push(new Set([x])); clues[x] = 1; S.K++; plants++;
      } else if (movable.length) {
        const x = rng.pick(movable), k = S.owner[x];
        clues[clueAt[k]] = 0; clueAt[k] = x; visited[k].add(x); clues[x] = cellsOf[k].length;
      } else { res = null; break; }
    }
    if (!res || res.count !== 1) continue;
    const rating = provisionalRating({ branches: res.branches, cells: n, clueDensity: (S.K / n) * 5 });
    const grid = [], shaded = [];
    for (let r = 0; r < rows; r++) {
      grid.push(Array.from({ length: cols }, (_, c) => clues[r * cols + c] || null));
      shaded.push(Array.from({ length: cols }, (_, c) => (intended[r * cols + c] ? "#" : ".")).join(""));
    }
    const puzzle = {
      id: `nurikabe-${rows}x${cols}-s${String(seed).padStart(6, "0")}`,
      type: "nurikabe", seed,
      params: { rows, cols, target_band: targetBand },
      difficulty: rating,
      clues: { grid },
      solution: { shaded },
      stats: { clue_count: S.K, attempts: attempt, patches, plants, white_cells: n - intended.reduce((a, b) => a + b, 0) },
    };
    if (targetBand == null || rating.band === targetBand) return puzzle;
    if (!best || Math.abs(rating.band - targetBand) < Math.abs(best.difficulty.band - targetBand)) best = puzzle;
  }
  return best;
}

/** Rule check for a full shading (Uint8Array, 1 = black). Returns { ok, reason }. */
export function validateShading(rows, cols, clues, shaded) {
  const n = rows * cols;
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c; if (shaded[a] && shaded[a + 1] && shaded[a + cols] && shaded[a + cols + 1]) return { ok: false, reason: "2x2 sea" }; }
  const seas = components(rows, cols, (i) => shaded[i] === 1);
  if (seas.length !== 1) return { ok: false, reason: `sea in ${seas.length} pieces` };
  for (const isl of components(rows, cols, (i) => !shaded[i])) {
    const cl = isl.filter((i) => clues[i]);
    if (cl.length !== 1) return { ok: false, reason: `island with ${cl.length} clues` };
    if (clues[cl[0]] !== isl.length) return { ok: false, reason: `island size ${isl.length} != ${clues[cl[0]]}` };
  }
  return { ok: true };
}

export function cluesFromPuzzle(p) {
  const { rows, cols } = p.params, out = new Int16Array(rows * cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[r * cols + c] = p.clues.grid[r][c] || 0;
  return out;
}
export function solutionShaded(p) {
  const { rows, cols } = p.params, out = new Uint8Array(rows * cols);
  p.solution.shaded.forEach((row, r) => [...row].forEach((ch, c) => (out[r * cols + c] = ch === "#" ? 1 : 0)));
  return out;
}
