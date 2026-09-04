import { buildEdges, validate, solutionState } from "./logic.js";
import { INK, PAPER, open, DIGIT_FONT, esc } from "../../lib/svg.js";

/** st: Int8Array over candidate edges (0/1/2, -1 unknown). */
export function svg(puzzle, { cell = 40, st = null, interactive = false, bad = false, paper = PAPER, font = DIGIT_FONT } = {}) {
  const { rows, cols } = puzzle.params, islands = puzzle.clues.islands;
  const { edges } = buildEdges(rows, cols, islands);
  const pad = cell * 0.5, W = cols * cell + pad * 2, H = rows * cell + pad * 2, R = cell * 0.36;
  const cx = (c) => pad + c * cell + cell / 2, cy = (r) => pad + r * cell + cell / 2;
  let o = open(W, H, 'data-role="board"') + `<rect width="${W}" height="${H}" fill="${paper}"/>`;
  // faint dots mark empty cells so the sea has texture on the page
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) o += `<circle cx="${cx(c)}" cy="${cy(r)}" r="${cell * 0.025}" fill="#c9c4b8"/>`;
  if (st) edges.forEach((e, idx) => {
    if (st[idx] <= 0) return;
    const [ar, ac] = islands[e.a], [br, bc] = islands[e.b];
    const x1 = cx(ac), y1 = cy(ar), x2 = cx(bc), y2 = cy(br), off = cell * 0.1, col = bad ? "#b23a3a" : INK;
    const offs = st[idx] === 2 ? [-off, off] : [0];
    for (const d of offs) o += e.horiz ? `<line x1="${x1 + R}" y1="${y1 + d}" x2="${x2 - R}" y2="${y2 + d}" stroke="${col}" stroke-width="${cell * 0.07}"/>` : `<line x1="${x1 + d}" y1="${y1 + R}" x2="${x2 + d}" y2="${y2 - R}" stroke="${col}" stroke-width="${cell * 0.07}"/>`;
  });
  for (const [r, c, n] of islands) {
    o += `<circle cx="${cx(c)}" cy="${cy(r)}" r="${R}" fill="${paper}" stroke="${INK}" stroke-width="${cell * 0.03}"/>`;
    o += `<text x="${cx(c)}" y="${cy(r) + R * 0.42}" text-anchor="middle" font-family="${font}" font-size="${R * 1.35}" fill="${INK}">${esc(n)}</text>`;
  }
  if (interactive) edges.forEach((e, idx) => {
    const [ar, ac] = islands[e.a], [br, bc] = islands[e.b], t = cell * 0.5;
    o += e.horiz ? `<rect data-edge="${idx}" x="${cx(ac) + R}" y="${cy(ar) - t / 2}" width="${cx(bc) - cx(ac) - 2 * R}" height="${t}" fill="transparent" style="cursor:pointer"/>`
      : `<rect data-edge="${idx}" x="${cx(ac) - t / 2}" y="${cy(ar) + R}" width="${t}" height="${cy(br) - cy(ar) - 2 * R}" fill="transparent" style="cursor:pointer"/>`;
  });
  return o + "</svg>";
}
export function thumbnail(puzzle) { return svg(puzzle, { cell: 20 }); }
export function solutionSvg(puzzle, opts = {}) { return svg(puzzle, { ...opts, st: solutionState(puzzle) }); }

export function mount(el, puzzle, saved, onChange) {
  const { rows, cols } = puzzle.params, { edges } = buildEdges(rows, cols, puzzle.clues.islands), E = edges.length;
  let st = saved && saved.bridges && saved.bridges.length === E ? Int8Array.from(saved.bridges) : new Int8Array(E);
  let bad = false;
  const draw = () => { el.innerHTML = svg(puzzle, { cell: 40, st, interactive: true, bad }); };
  const changed = () => { onChange && onChange({ bridges: Array.from(st) }); draw(); };
  const onClick = (ev) => {
    const t = ev.target.closest("[data-edge]"); if (!t) return;
    const e = +t.dataset.edge;
    if (ev.type === "contextmenu" || ev.shiftKey) { ev.preventDefault(); st[e] = 0; } else st[e] = (st[e] + 1) % 3;
    bad = false; changed();
  };
  el.addEventListener("click", onClick); el.addEventListener("contextmenu", onClick);
  draw();
  return {
    handleKey() { return false; },
    check() {
      const v = validate(puzzle, st); bad = !v.ok; draw();
      const sol = solutionState(puzzle); let wrong = 0; for (let e = 0; e < E; e++) if (st[e] > 0 && st[e] !== sol[e]) wrong++;
      return { complete: v.ok && v.complete, correct: v.ok && v.complete, wrongCount: v.ok ? wrong : 1, reason: v.reason };
    },
    reveal() { st = solutionState(puzzle); bad = false; changed(); },
    reset() { st = new Int8Array(E); bad = false; changed(); },
    serialize() { return { bridges: Array.from(st) }; },
    progress() { const sol = solutionState(puzzle); return { filled: Array.from(st).filter((x) => x > 0).length, total: Array.from(sol).filter((x) => x > 0).length }; },
    destroy() { el.removeEventListener("click", onClick); el.removeEventListener("contextmenu", onClick); el.innerHTML = ""; },
  };
}
export const hint = "Tap between two islands for one bridge, again for two, again to clear. Shift-click or right-click clears.";
