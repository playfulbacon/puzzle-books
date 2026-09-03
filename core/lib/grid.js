// Small grid helpers shared by every genre. Cells are flat indices i = r*cols + c.
export const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function neighbors(i, rows, cols) {
  const r = Math.floor(i / cols), c = i % cols, out = [];
  if (r > 0) out.push(i - cols);
  if (r < rows - 1) out.push(i + cols);
  if (c > 0) out.push(i - 1);
  if (c < cols - 1) out.push(i + 1);
  return out;
}

/** Flood fill over cells where `ok(i)` is true, starting from `start` (index or array). Returns Set of reached indices. */
export function flood(start, rows, cols, ok) {
  const seen = new Set();
  const stack = Array.isArray(start) ? start.slice() : [start];
  for (const s of stack) seen.add(s);
  while (stack.length) {
    const i = stack.pop();
    for (const j of neighbors(i, rows, cols)) if (!seen.has(j) && ok(j)) { seen.add(j); stack.push(j); }
  }
  return seen;
}

/** Connected components of cells satisfying `ok`. Returns array of arrays. */
export function components(rows, cols, ok) {
  const seen = new Uint8Array(rows * cols), out = [];
  for (let i = 0; i < rows * cols; i++) {
    if (seen[i] || !ok(i)) continue;
    const comp = [i]; seen[i] = 1;
    for (let k = 0; k < comp.length; k++) for (const j of neighbors(comp[k], rows, cols)) if (!seen[j] && ok(j)) { seen[j] = 1; comp.push(j); }
    out.push(comp);
  }
  return out;
}

/** Iterate the 2x2 blocks that contain cell i; yields arrays of 4 indices. */
export function blocksAround(i, rows, cols) {
  const r = Math.floor(i / cols), c = i % cols, out = [];
  for (const [dr, dc] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) {
    const r0 = r + dr, c0 = c + dc;
    if (r0 < 0 || c0 < 0 || r0 + 1 >= rows || c0 + 1 >= cols) continue;
    out.push([r0 * cols + c0, r0 * cols + c0 + 1, (r0 + 1) * cols + c0, (r0 + 1) * cols + c0 + 1]);
  }
  return out;
}

export function parseSize(s, fallback = [10, 10]) {
  const m = /^(\d+)x(\d+)$/i.exec(s || "");
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : fallback;
}
