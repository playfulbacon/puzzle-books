import { layout, cluesFromPuzzle, solutionCells, validate, FWD, BACK } from "./logic.js";
import { INK, PAPER, SOFT, LINE_INNER, open, gridLines, cellTargets, DIGIT_FONT, esc } from "../../lib/svg.js";

/** cells: Int8Array (-1 none, 0 "\\", 1 "/") */
export function svg(puzzle, { cell = 40, cells = null, interactive = false, bad = false, paper = PAPER, font = DIGIT_FONT } = {}) {
  const { rows, cols } = puzzle.params;
  const L = layout(rows, cols), clues = cluesFromPuzzle(puzzle);
  const pad = cell * 0.5, W = cols * cell + pad * 2, H = rows * cell + pad * 2;
  let o = open(W, H, 'data-role="board"') + `<rect width="${W}" height="${H}" fill="${paper}"/>`;
  o += gridLines(rows, cols, cell, pad, { inner: cell * LINE_INNER, outer: cell * LINE_INNER, outerColor: SOFT });
  if (cells) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const v = cells[r * cols + c]; if (v < 0) continue;
    const x = pad + c * cell, y = pad + r * cell;
    o += v === FWD ? `<line x1="${x + cell}" y1="${y}" x2="${x}" y2="${y + cell}" stroke="${bad ? "#b23a3a" : INK}" stroke-width="${cell * 0.085}" stroke-linecap="round"/>`
      : `<line x1="${x}" y1="${y}" x2="${x + cell}" y2="${y + cell}" stroke="${bad ? "#b23a3a" : INK}" stroke-width="${cell * 0.085}" stroke-linecap="round"/>`;
  }
  const rad = cell * 0.24;
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    const k = clues[L.vIdx(r, c)]; if (k < 0) continue;
    const x = pad + c * cell, y = pad + r * cell;
    o += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${paper}" stroke="${INK}" stroke-width="${cell * 0.02}"/>`;
    o += `<text x="${x}" y="${y + rad * 0.58}" text-anchor="middle" font-family="${font}" font-size="${rad * 1.6}" fill="${INK}">${esc(k)}</text>`;
  }
  if (interactive) o += cellTargets(rows, cols, cell, pad);
  return o + "</svg>";
}
export function thumbnail(puzzle) { return svg(puzzle, { cell: 20 }); }
export function solutionSvg(puzzle, opts = {}) { return svg(puzzle, { ...opts, cells: solutionCells(puzzle) }); }

export function mount(el, puzzle, saved, onChange) {
  const { rows, cols } = puzzle.params, n = rows * cols;
  let cells = saved && saved.cells && saved.cells.length === n ? Int8Array.from(saved.cells) : new Int8Array(n).fill(-1);
  let bad = false;
  const draw = () => { el.innerHTML = svg(puzzle, { cell: 40, cells, interactive: true, bad }); };
  const changed = () => { onChange && onChange({ cells: Array.from(cells) }); draw(); };
  const onClick = (ev) => {
    const t = ev.target.closest("[data-cell]"); if (!t) return;
    const i = +t.dataset.cell;
    if (ev.type === "contextmenu" || ev.shiftKey) { ev.preventDefault(); cells[i] = cells[i] === BACK ? -1 : BACK; }
    else cells[i] = cells[i] === -1 ? FWD : cells[i] === FWD ? BACK : -1;
    bad = false; changed();
  };
  el.addEventListener("click", onClick); el.addEventListener("contextmenu", onClick);
  draw();
  return {
    handleKey() { return false; },
    check() {
      const v = validate(puzzle, cells); bad = !v.ok; draw();
      const sol = solutionCells(puzzle); let wrong = 0; for (let i = 0; i < n; i++) if (cells[i] >= 0 && cells[i] !== sol[i]) wrong++;
      return { complete: v.ok && v.complete, correct: v.ok && v.complete, wrongCount: v.ok ? wrong : 1, reason: v.reason };
    },
    reveal() { cells = solutionCells(puzzle); bad = false; changed(); },
    reset() { cells = new Int8Array(n).fill(-1); bad = false; changed(); },
    serialize() { return { cells: Array.from(cells) }; },
    progress() { return { filled: Array.from(cells).filter((x) => x >= 0).length, total: n }; },
    destroy() { el.removeEventListener("click", onClick); el.removeEventListener("contextmenu", onClick); el.innerHTML = ""; },
  };
}
export const hint = "Tap a cell for a / diagonal, tap again for \\, again to clear. Shift-click or right-click places \\ directly.";
