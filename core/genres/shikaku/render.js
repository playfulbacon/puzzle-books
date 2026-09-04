import { cluesFromPuzzle, validate } from "./logic.js";
import { INK, PAPER, DIGIT_FONT, open, digit, gridLines, cellTargets } from "../../lib/svg.js";

export function svg(puzzle, { cell = 40, rects = [], preview = null, interactive = false, bad = false, paper = PAPER, font = DIGIT_FONT } = {}) {
  const { rows, cols } = puzzle.params;
  const clues = cluesFromPuzzle(puzzle);
  const pad = cell * 0.15, W = cols * cell + pad * 2, H = rows * cell + pad * 2;
  let o = open(W, H, 'data-role="board"') + `<rect width="${W}" height="${H}" fill="${paper}"/>`;
  for (const [r, c, h, w] of rects) o += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${w * cell}" height="${h * cell}" fill="#f1efe9"/>`;
  o += gridLines(rows, cols, cell, pad);
  for (const [r, c, h, w] of rects) o += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${w * cell}" height="${h * cell}" fill="none" stroke="${bad ? "#b23a3a" : INK}" stroke-width="${cell * 0.075}" stroke-linejoin="round"/>`;
  if (preview) { const [r, c, h, w] = preview; o += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${w * cell}" height="${h * cell}" fill="rgba(47,93,98,0.12)" stroke="#2f5d62" stroke-width="${cell * 0.05}" stroke-dasharray="${cell * 0.12} ${cell * 0.08}"/>`; }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (clues[r * cols + c]) o += digit(pad + c * cell + cell / 2, pad + r * cell + cell / 2, cell, clues[r * cols + c], INK, font);
  if (interactive) o += cellTargets(rows, cols, cell, pad);
  return o + "</svg>";
}
export function thumbnail(puzzle) { return svg(puzzle, { cell: 20 }); }
export function solutionSvg(puzzle, opts = {}) { return svg(puzzle, { ...opts, rects: puzzle.solution.rects }); }

export function mount(el, puzzle, saved, onChange) {
  const { rows, cols } = puzzle.params;
  let rects = saved && saved.rects ? saved.rects.map((r) => r.slice()) : [];
  let start = null, preview = null, bad = false;
  const draw = () => { el.innerHTML = svg(puzzle, { cell: 40, rects, preview, interactive: true, bad }); };
  const changed = () => { onChange && onChange({ rects }); draw(); };
  const cellAt = (ev) => { const t = document.elementFromPoint(ev.clientX, ev.clientY); const q = t && t.closest && t.closest("[data-cell]"); return q ? +q.dataset.cell : null; };
  const norm = (a, b) => { const r1 = Math.floor(a / cols), c1 = a % cols, r2 = Math.floor(b / cols), c2 = b % cols; return [Math.min(r1, r2), Math.min(c1, c2), Math.abs(r1 - r2) + 1, Math.abs(c1 - c2) + 1]; };
  const inside = ([r, c, h, w], i) => { const rr = Math.floor(i / cols), cc = i % cols; return rr >= r && rr < r + h && cc >= c && cc < c + w; };
  const down = (ev) => { const i = cellAt(ev); if (i == null) return; ev.preventDefault(); start = i; preview = norm(i, i); el.setPointerCapture && el.setPointerCapture(ev.pointerId); draw(); };
  const move = (ev) => { if (start == null) return; const i = cellAt(ev); if (i == null) return; preview = norm(start, i); draw(); };
  const up = (ev) => {
    if (start == null) return;
    const i = cellAt(ev) ?? start; const rect = norm(start, i);
    start = null; preview = null; bad = false;
    if (rect[2] === 1 && rect[3] === 1) { const k = rects.findIndex((q) => inside(q, i)); if (k >= 0) { rects.splice(k, 1); changed(); return; } }
    rects = rects.filter((q) => !(q[0] < rect[0] + rect[2] && rect[0] < q[0] + q[2] && q[1] < rect[1] + rect[3] && rect[1] < q[1] + q[3])); // replace overlaps
    rects.push(rect); changed();
  };
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up);
  draw();
  return {
    handleKey() { return false; },
    check() { const v = validate(puzzle, rects); bad = !v.ok; draw(); return { complete: v.ok && v.complete, correct: v.ok && v.complete, wrongCount: v.ok ? 0 : 1, reason: v.reason }; },
    reveal() { rects = puzzle.solution.rects.map((r) => r.slice()); bad = false; changed(); },
    reset() { rects = []; bad = false; changed(); },
    serialize() { return { rects }; },
    progress() { return { filled: rects.reduce((s, [, , h, w]) => s + h * w, 0), total: rows * cols }; },
    destroy() { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.innerHTML = ""; },
  };
}
export const hint = "Drag from one corner of a rectangle to the opposite corner. Tap inside a rectangle to remove it.";
