// Shikaku: random rectangle partition, clue placement, uniqueness oracle.
import { Rng } from "../../lib/rng.js";
import { provisionalRating } from "../../lib/difficulty.js";

/** Random guillotine partition into rectangles [r, c, h, w]. */
export function randomPartition(rows, cols, rng, { maxArea = 12, stop = 0.5 } = {}) {
  const rects = [];
  (function split(r, c, h, w) {
    const area = h * w;
    if (area <= 3 || (area <= maxArea && rng.chance(stop))) { rects.push([r, c, h, w]); return; }
    const vertical = w > h || (w === h && rng.chance(0.5));
    if (vertical && w > 1) { const k = rng.range(1, w - 1); split(r, c, h, k); split(r, c + k, h, w - k); }
    else if (h > 1) { const k = rng.range(1, h - 1); split(r, c, k, w); split(r + k, c, h - k, w); }
    else if (w > 1) { const k = rng.range(1, w - 1); split(r, c, h, k); split(r, c + k, h, w - k); }
    else rects.push([r, c, h, w]);
  })(0, 0, rows, cols);
  return rects;
}

/** All rectangles of area n containing cell (cr,cc), inside the grid, containing no other clue. */
function candidates(rows, cols, clues, cr, cc, n) {
  const out = [];
  for (let h = 1; h <= n; h++) {
    if (n % h) continue;
    const w = n / h;
    if (h > rows || w > cols) continue;
    for (let r = Math.max(0, cr - h + 1); r <= Math.min(cr, rows - h); r++) {
      for (let c = Math.max(0, cc - w + 1); c <= Math.min(cc, cols - w); c++) {
        let ok = true;
        for (let rr = r; rr < r + h && ok; rr++) for (let cc2 = c; cc2 < c + w; cc2++) {
          if ((rr !== cr || cc2 !== cc) && clues[rr * cols + cc2]) { ok = false; break; }
        }
        if (ok) out.push([r, c, h, w]);
      }
    }
  }
  return out;
}

/** clues: Int16Array(rows*cols), 0 = none. Returns { count, branches, solution: rects[] }. */
export function countSolutions(rows, cols, clues, limit = 2) {
  const n = rows * cols;
  const clueList = [];
  for (let i = 0; i < n; i++) if (clues[i]) clueList.push({ i, r: Math.floor(i / cols), c: i % cols, n: clues[i] });
  const total = clueList.reduce((s, q) => s + q.n, 0);
  if (total !== n) return { count: 0, branches: 0, solution: null };
  const cands = clueList.map((q) => candidates(rows, cols, clues, q.r, q.c, q.n).map(([r, c, h, w]) => {
    const cells = []; for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) cells.push(rr * cols + cc);
    return { rect: [r, c, h, w], cells };
  }));
  if (cands.some((list) => !list.length)) return { count: 0, branches: 0, solution: null };

  let count = 0, branches = 0, first = null;
  const covered = new Uint8Array(n);
  const chosen = new Array(clueList.length).fill(null);

  function fits(cand) { for (const x of cand.cells) if (covered[x]) return false; return true; }

  function rec() {
    // Pick the unplaced clue with the fewest fitting candidates.
    let best = -1, bestList = null;
    for (let k = 0; k < clueList.length; k++) {
      if (chosen[k]) continue;
      const list = cands[k].filter(fits);
      if (!list.length) return false;
      if (!bestList || list.length < bestList.length) { best = k; bestList = list; if (list.length === 1) break; }
    }
    if (best === -1) {
      count++;
      if (!first) first = chosen.map((c) => c.rect);
      return count >= limit;
    }
    // Every uncovered cell must still be coverable by some unplaced clue.
    for (let x = 0; x < n; x++) {
      if (covered[x]) continue;
      let ok = false;
      for (let k = 0; k < clueList.length && !ok; k++) { if (chosen[k]) continue; for (const cand of cands[k]) if (cand.cells.includes(x) && fits(cand)) { ok = true; break; } }
      if (!ok) return false;
    }
    if (bestList.length > 1) branches++;
    for (const cand of bestList) {
      chosen[best] = cand; for (const x of cand.cells) covered[x] = 1;
      const stop = rec();
      chosen[best] = null; for (const x of cand.cells) covered[x] = 0;
      if (stop) return true;
    }
    return false;
  }
  rec();
  return { count, branches, solution: first };
}

export function generate({ rows = 10, cols = 10, seed = 1, targetBand = null, maxAttempts = 30 } = {}) {
  const rng = new Rng(seed);
  const maxArea = Math.max(8, Math.round(rows * cols / 8));
  let best = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const rects = randomPartition(rows, cols, rng, { maxArea, stop: 0.45 });
    // Relocate numbers within their rectangles until the puzzle is unique.
    for (let place = 0; place < 8; place++) {
      const clues = new Int16Array(rows * cols);
      for (const [r, c, h, w] of rects) clues[(r + rng.int(h)) * cols + c + rng.int(w)] = h * w;
      const res = countSolutions(rows, cols, clues, 2);
      if (res.count !== 1) continue;
      const rating = provisionalRating({ branches: res.branches, cells: rows * cols, clueDensity: rects.length / (rows * cols) * 3 });
      const grid = [];
      for (let r = 0; r < rows; r++) grid.push(Array.from({ length: cols }, (_, c) => clues[r * cols + c] || null));
      const puzzle = {
        id: `shikaku-${rows}x${cols}-s${String(seed).padStart(6, "0")}`,
        type: "shikaku", seed,
        params: { rows, cols, target_band: targetBand },
        difficulty: rating,
        clues: { grid },
        solution: { rects: rects.map(([r, c, h, w]) => [r, c, h, w]) },
        stats: { clue_count: rects.length, attempts: attempt, max_area: Math.max(...rects.map(([, , h, w]) => h * w)) },
      };
      if (targetBand == null || rating.band === targetBand) return puzzle;
      if (!best || Math.abs(rating.band - targetBand) < Math.abs(best.difficulty.band - targetBand)) best = puzzle;
      break;
    }
  }
  return best;
}

export function cluesFromPuzzle(p) {
  const { rows, cols } = p.params, out = new Int16Array(rows * cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[r * cols + c] = p.clues.grid[r][c] || 0;
  return out;
}

/** Validate a set of rectangles against the rules (partition + one clue each of matching area). */
export function validate(p, rects) {
  const { rows, cols } = p.params, n = rows * cols, cover = new Int16Array(n).fill(-1);
  const clues = cluesFromPuzzle(p);
  for (let k = 0; k < rects.length; k++) {
    const [r, c, h, w] = rects[k];
    let clueCount = 0;
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) {
      const i = rr * cols + cc;
      if (rr < 0 || cc < 0 || rr >= rows || cc >= cols || cover[i] >= 0) return { ok: false, reason: "overlap" };
      cover[i] = k;
      if (clues[i]) { clueCount++; if (clues[i] !== h * w) return { ok: false, reason: "area" }; }
    }
    if (clueCount !== 1) return { ok: false, reason: "clue-count" };
  }
  const complete = cover.every((x) => x >= 0);
  return { ok: true, complete };
}
