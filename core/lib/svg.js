// Shared drawing constants so every genre draws with the same ink, weights, and type.
export const INK = "#1c1b18";
export const PAPER = "#ffffff";
export const DIGIT_FONT = "'IBM Plex Sans', Helvetica, Arial, sans-serif";
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const open = (W, H, extra = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${extra}>`;
export const digit = (x, y, cell, text, color = INK) =>
  `<text x="${x}" y="${y + cell * 0.2}" text-anchor="middle" font-family="${DIGIT_FONT}" font-size="${cell * 0.56}" fill="${color}">${esc(text)}</text>`;
/** Square grid lines: thin inner, thick outer. */
export function gridLines(rows, cols, cell, pad, { inner = cell * 0.02, outer = cell * 0.06 } = {}) {
  let o = "";
  for (let k = 0; k <= cols; k++) o += `<line x1="${pad + k * cell}" y1="${pad}" x2="${pad + k * cell}" y2="${pad + rows * cell}" stroke="${INK}" stroke-width="${k === 0 || k === cols ? outer : inner}"/>`;
  for (let k = 0; k <= rows; k++) o += `<line x1="${pad}" y1="${pad + k * cell}" x2="${pad + cols * cell}" y2="${pad + k * cell}" stroke="${INK}" stroke-width="${k === 0 || k === rows ? outer : inner}"/>`;
  return o;
}
export function cellTargets(rows, cols, cell, pad) {
  let o = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) o += `<rect data-cell="${r * cols + c}" x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="transparent" style="cursor:pointer"/>`;
  return o;
}
