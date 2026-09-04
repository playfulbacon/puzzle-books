import { cluesFromPuzzle, solutionShaded } from "./logic.js";
import { INK, PAPER, DIGIT_FONT, open, digit, gridLines, cellTargets } from "../../lib/svg.js";

/** marks: Int8Array (0 unknown, 1 black, 2 dot) or Uint8Array 0/1 for a solution. */
export function svg(puzzle, { cell = 40, marks = null, interactive = false, wrong = null, paper = PAPER, font = DIGIT_FONT } = {}) {
  const { rows, cols } = puzzle.params;
  const clues = cluesFromPuzzle(puzzle);
  const pad = cell * 0.15, W = cols * cell + pad * 2, H = rows * cell + pad * 2;
  let o = open(W, H, 'data-role="board"') + `<rect width="${W}" height="${H}" fill="${paper}"/>`;
  if (marks) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const m = marks[r * cols + c], i = r * cols + c;
    if (m === 1) o += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="${wrong && wrong.has(i) ? "#b23a3a" : INK}"/>`;
    else if (m === 2 && interactive) o += `<circle cx="${pad + c * cell + cell / 2}" cy="${pad + r * cell + cell / 2}" r="${cell * 0.08}" fill="#9a958a"/>`;
  }
  o += gridLines(rows, cols, cell, pad);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (clues[r * cols + c]) o += digit(pad + c * cell + cell / 2, pad + r * cell + cell / 2, cell, clues[r * cols + c], INK, font);
  if (interactive) o += cellTargets(rows, cols, cell, pad);
  return o + "</svg>";
}
export function thumbnail(puzzle) { return svg(puzzle, { cell: 20 }); }
export function solutionSvg(puzzle, opts = {}) { return svg(puzzle, { ...opts, marks: solutionShaded(puzzle) }); }

export function mount(el, puzzle, saved, onChange) {
  const { rows, cols } = puzzle.params, n = rows * cols;
  const clues = cluesFromPuzzle(puzzle);
  const solution = puzzle.solution ? solutionShaded(puzzle) : null;
  let marks = saved && saved.marks && saved.marks.length === n ? Int8Array.from(saved.marks) : new Int8Array(n);
  let wrong = new Set();
  const draw = () => { el.innerHTML = svg(puzzle, { cell: 40, marks, interactive: true, wrong }); };
  const changed = () => { onChange && onChange({ marks: Array.from(marks) }); draw(); };
  const onClick = (ev) => {
    const t = ev.target.closest("[data-cell]"); if (!t) return;
    const i = +t.dataset.cell; if (clues[i]) return;
    if (ev.type === "contextmenu" || ev.shiftKey) { ev.preventDefault(); marks[i] = marks[i] === 2 ? 0 : 2; }
    else marks[i] = (marks[i] + 1) % 3;
    wrong.delete(i); changed();
  };
  el.addEventListener("click", onClick); el.addEventListener("contextmenu", onClick);
  draw();
  return {
    handleKey() { return false; },
    check() {
      wrong = new Set(); let missing = 0;
      for (let i = 0; i < n; i++) { if (marks[i] === 1 && solution && !solution[i]) wrong.add(i); if (solution && solution[i] && marks[i] !== 1) missing++; }
      draw();
      return { complete: missing === 0, correct: missing === 0 && wrong.size === 0, wrongCount: wrong.size };
    },
    reveal() { if (!solution) return; marks = Int8Array.from(solution); wrong = new Set(); changed(); },
    reset() { marks = new Int8Array(n); wrong = new Set(); changed(); },
    serialize() { return { marks: Array.from(marks) }; },
    progress() { let f = 0, t = 0; for (let i = 0; i < n; i++) { if (marks[i] === 1) f++; if (solution && solution[i]) t++; } return { filled: f, total: t }; },
    destroy() { el.removeEventListener("click", onClick); el.removeEventListener("contextmenu", onClick); el.innerHTML = ""; },
  };
}
export const hint = "Tap a cell to shade it, tap again for a dot (known white), again to clear. Shift-click or right-click places a dot directly.";
