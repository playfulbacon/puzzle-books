import { layout, pearlsFromPuzzle, solutionEdges, UNKNOWN, LINE, CROSS, WHITE, BLACK } from "./logic.js";
import { INK, open } from "../../lib/svg.js";

/** state: Int8Array(E) UNKNOWN/LINE/CROSS (interactive) or Uint8Array 0/1 (solution). */
export function svg(puzzle, { cell = 40, state = null, interactive = false, wrong = null } = {}) {
  const { rows, cols } = puzzle.params;
  const L = layout(rows, cols), pearls = pearlsFromPuzzle(puzzle);
  const pad = cell * 0.15, W = cols * cell + pad * 2, H = rows * cell + pad * 2;
  const cx = (c) => pad + c * cell + cell / 2, cy = (r) => pad + r * cell + cell / 2;
  let o = open(W, H, 'data-role="board"') + `<rect width="${W}" height="${H}" fill="#fff"/>`;
  for (let k = 0; k <= cols; k++) o += `<line x1="${pad + k * cell}" y1="${pad}" x2="${pad + k * cell}" y2="${pad + rows * cell}" stroke="#b9b4a8" stroke-width="${k === 0 || k === cols ? cell * 0.04 : cell * 0.015}"/>`;
  for (let k = 0; k <= rows; k++) o += `<line x1="${pad}" y1="${pad + k * cell}" x2="${pad + cols * cell}" y2="${pad + k * cell}" stroke="#b9b4a8" stroke-width="${k === 0 || k === rows ? cell * 0.04 : cell * 0.015}"/>`;
  const seg = (e) => { const [a, b] = L.ends[e]; return [cx(a % cols), cy(Math.floor(a / cols)), cx(b % cols), cy(Math.floor(b / cols))]; };
  if (state) for (let e = 0; e < L.E; e++) {
    const [x1, y1, x2, y2] = seg(e);
    if (state[e] === LINE) o += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${wrong && wrong.has(e) ? "#b23a3a" : INK}" stroke-width="${cell * 0.1}" stroke-linecap="round"/>`;
    else if (state[e] === CROSS && interactive) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = cell * 0.06; o += `<path d="M${mx - d} ${my - d}L${mx + d} ${my + d}M${mx + d} ${my - d}L${mx - d} ${my + d}" stroke="#9a958a" stroke-width="1.5"/>`; }
  }
  const R = cell * 0.3;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const p = pearls[r * cols + c]; if (!p) continue;
    o += p === WHITE ? `<circle cx="${cx(c)}" cy="${cy(r)}" r="${R}" fill="#fff" stroke="${INK}" stroke-width="${cell * 0.06}"/>` : `<circle cx="${cx(c)}" cy="${cy(r)}" r="${R}" fill="${INK}"/>`;
  }
  if (interactive) for (let e = 0; e < L.E; e++) {
    const [x1, y1, x2, y2] = seg(e), t = cell * 0.4;
    o += x1 === x2 ? `<rect data-edge="${e}" x="${x1 - t / 2}" y="${y1 + cell * 0.2}" width="${t}" height="${cell * 0.6}" fill="transparent" style="cursor:pointer"/>`
      : `<rect data-edge="${e}" x="${x1 + cell * 0.2}" y="${y1 - t / 2}" width="${cell * 0.6}" height="${t}" fill="transparent" style="cursor:pointer"/>`;
  }
  return o + "</svg>";
}
export function thumbnail(puzzle) { return svg(puzzle, { cell: 20 }); }
export function solutionSvg(puzzle, opts = {}) { const L = layout(puzzle.params.rows, puzzle.params.cols); return svg(puzzle, { ...opts, state: solutionEdges(puzzle, L) }); }

export function mount(el, puzzle, saved, onChange) {
  const { rows, cols } = puzzle.params, L = layout(rows, cols);
  const solution = puzzle.solution ? solutionEdges(puzzle, L) : null;
  let state = saved && saved.edges && saved.edges.length === L.E ? Int8Array.from(saved.edges) : new Int8Array(L.E);
  let wrong = new Set();
  const draw = () => { el.innerHTML = svg(puzzle, { cell: 40, state, interactive: true, wrong }); };
  const changed = () => { onChange && onChange({ edges: Array.from(state) }); draw(); };
  const onClick = (ev) => {
    const t = ev.target.closest("[data-edge]"); if (!t) return;
    const e = +t.dataset.edge;
    if (ev.type === "contextmenu" || ev.shiftKey) { ev.preventDefault(); state[e] = state[e] === CROSS ? UNKNOWN : CROSS; }
    else state[e] = state[e] === UNKNOWN ? LINE : state[e] === LINE ? CROSS : UNKNOWN;
    wrong.delete(e); changed();
  };
  el.addEventListener("click", onClick); el.addEventListener("contextmenu", onClick);
  draw();
  return {
    handleKey() { return false; },
    check() {
      wrong = new Set(); let missing = 0;
      for (let e = 0; e < L.E; e++) { if (state[e] === LINE && solution && !solution[e]) wrong.add(e); if (solution && solution[e] && state[e] !== LINE) missing++; }
      draw();
      return { complete: missing === 0, correct: missing === 0 && wrong.size === 0, wrongCount: wrong.size };
    },
    reveal() { if (!solution) return; state = Int8Array.from(solution, (x) => (x ? LINE : UNKNOWN)); wrong = new Set(); changed(); },
    reset() { state = new Int8Array(L.E); wrong = new Set(); changed(); },
    serialize() { return { edges: Array.from(state) }; },
    progress() { let lines = 0, total = 0; for (let e = 0; e < L.E; e++) { if (state[e] === LINE) lines++; if (solution && solution[e]) total++; } return { filled: lines, total }; },
    destroy() { el.removeEventListener("click", onClick); el.removeEventListener("contextmenu", onClick); el.innerHTML = ""; },
  };
}
export const hint = "Tap between two cells to draw the loop, tap again for a cross, again to clear. Shift-click or right-click marks a cross directly.";
