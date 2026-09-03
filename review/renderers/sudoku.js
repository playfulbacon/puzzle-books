// Sudoku renderer for the review app.
// Contract (shared by every genre renderer):
//   thumbnail(puzzle) -> SVG markup string (static, givens only)
//   mount(el, puzzle, saved, onChange) -> controller
//     controller: { handleKey(e) -> bool, check() -> {complete, correct}, reveal(), reset(),
//                   serialize() -> state, destroy() }
(function () {
  const parse = (s) => s.split("").map((c) => (c === "." ? 0 : parseInt(c, 10)));

  const svgGrid = (puzzle, cellPx, opts) => {
    const { rows, cols, box_rows: br, box_cols: bc } = puzzle.params;
    const givens = parse(puzzle.clues.grid);
    const entries = opts.entries || [];
    const sel = opts.selected ?? -1;
    const wrong = opts.wrong || new Set();
    const solution = puzzle.solution ? parse(puzzle.solution.grid) : null;
    const pad = 2;
    const W = cols * cellPx + pad * 2, H = rows * cellPx + pad * 2;
    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-role="board">`);
    out.push(`<rect x="${pad}" y="${pad}" width="${cols * cellPx}" height="${rows * cellPx}" fill="#fff"/>`);

    // Highlights (interactive only)
    if (opts.interactive) {
      const selVal = sel >= 0 ? (givens[sel] || entries[sel] || 0) : 0;
      const sr = Math.floor(sel / cols), sc = sel % cols;
      for (let i = 0; i < rows * cols; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        let fill = null;
        if (sel >= 0) {
          const sameBox = Math.floor(r / br) === Math.floor(sr / br) && Math.floor(c / bc) === Math.floor(sc / bc);
          if (r === sr || c === sc || sameBox) fill = "var(--peer)";
          if (selVal && (givens[i] || entries[i]) === selVal) fill = "var(--same)";
          if (i === sel) fill = "var(--select)";
        }
        if (wrong.has(i)) fill = "var(--conflict)";
        if (fill) out.push(`<rect x="${pad + c * cellPx}" y="${pad + r * cellPx}" width="${cellPx}" height="${cellPx}" fill="${fill}"/>`);
      }
    }

    // Grid lines: thin cell lines, thick box lines
    for (let k = 0; k <= cols; k++) {
      const x = pad + k * cellPx, thick = k % bc === 0;
      out.push(`<line x1="${x}" y1="${pad}" x2="${x}" y2="${pad + rows * cellPx}" stroke="#1c1b18" stroke-width="${thick ? cellPx * 0.07 : cellPx * 0.02}" stroke-linecap="square"/>`);
    }
    for (let k = 0; k <= rows; k++) {
      const y = pad + k * cellPx, thick = k % br === 0;
      out.push(`<line x1="${pad}" y1="${y}" x2="${pad + cols * cellPx}" y2="${y}" stroke="#1c1b18" stroke-width="${thick ? cellPx * 0.07 : cellPx * 0.02}" stroke-linecap="square"/>`);
    }

    // Digits
    const fs = cellPx * 0.62;
    for (let i = 0; i < rows * cols; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const g = givens[i], e = entries[i];
      if (!g && !e) continue;
      const x = pad + c * cellPx + cellPx / 2, y = pad + r * cellPx + cellPx / 2 + fs * 0.36;
      const color = g ? "#1c1b18" : (wrong.has(i) ? "var(--reject)" : "var(--entry)");
      const weight = g ? 500 : 400;
      out.push(`<text x="${x}" y="${y}" text-anchor="middle" font-family="Iowan Old Style, Palatino, Georgia, serif" font-size="${fs}" font-weight="${weight}" fill="${color}">${g || e}</text>`);
    }

    // Click targets
    if (opts.interactive) {
      for (let i = 0; i < rows * cols; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        out.push(`<rect data-cell="${i}" x="${pad + c * cellPx}" y="${pad + r * cellPx}" width="${cellPx}" height="${cellPx}" fill="transparent" style="cursor:pointer"/>`);
      }
    }
    out.push("</svg>");
    return out.join("");
  };

  function thumbnail(puzzle) {
    return svgGrid(puzzle, 20, { interactive: false });
  }

  function mount(el, puzzle, saved, onChange) {
    const n = puzzle.params.rows * puzzle.params.cols;
    const givens = parse(puzzle.clues.grid);
    const solution = puzzle.solution ? parse(puzzle.solution.grid) : null;
    let entries = (saved && saved.entries && saved.entries.length === n) ? saved.entries.slice() : new Array(n).fill(0);
    let selected = -1;
    let wrong = new Set();

    const draw = () => {
      el.innerHTML = svgGrid(puzzle, 40, { interactive: true, entries, selected, wrong });
    };
    const changed = () => { onChange && onChange({ entries }); draw(); };

    el.addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-cell]");
      if (!t) return;
      selected = parseInt(t.dataset.cell, 10);
      el.focus();
      draw();
    });
    el.tabIndex = 0;
    draw();

    return {
      handleKey(e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return false;
        const cols = puzzle.params.cols;
        if (selected < 0 && /^[1-9]$/.test(e.key)) return false;
        if (e.key.startsWith("Arrow")) {
          if (selected < 0) selected = 0;
          else if (e.key === "ArrowLeft") selected = (selected % cols) ? selected - 1 : selected;
          else if (e.key === "ArrowRight") selected = (selected % cols < cols - 1) ? selected + 1 : selected;
          else if (e.key === "ArrowUp") selected = selected >= cols ? selected - cols : selected;
          else if (e.key === "ArrowDown") selected = selected < n - cols ? selected + cols : selected;
          draw(); return true;
        }
        if (selected < 0 || givens[selected]) return false;
        if (/^[1-9]$/.test(e.key)) {
          entries[selected] = parseInt(e.key, 10); wrong.delete(selected); changed(); return true;
        }
        if (e.key === "Backspace" || e.key === "Delete" || e.key === "0" || e.key === " ") {
          entries[selected] = 0; wrong.delete(selected); changed(); return true;
        }
        return false;
      },
      check() {
        wrong = new Set();
        let complete = true;
        for (let i = 0; i < n; i++) {
          if (givens[i]) continue;
          if (!entries[i]) { complete = false; continue; }
          if (solution && entries[i] !== solution[i]) wrong.add(i);
        }
        draw();
        return { complete, correct: complete && wrong.size === 0, wrongCount: wrong.size };
      },
      reveal() {
        if (!solution) return;
        entries = solution.map((d, i) => (givens[i] ? 0 : d));
        wrong = new Set(); changed();
      },
      reset() { entries = new Array(n).fill(0); wrong = new Set(); changed(); },
      serialize() { return { entries }; },
      progress() {
        const total = givens.filter((g) => !g).length;
        const filled = entries.filter((e, i) => e && !givens[i]).length;
        return { filled, total };
      },
      destroy() { el.innerHTML = ""; },
    };
  }

  window.PuzzleRenderers = window.PuzzleRenderers || {};
  window.PuzzleRenderers.sudoku = { thumbnail, mount, label: "Sudoku" };
})();
