import * as logic from "./logic.js";
import * as render from "./render.js";
export default {
  id: "shikaku",
  label: "Shikaku",
  japanese: "四角に切れ",
  rules: "Divide the grid into rectangles. Each rectangle contains exactly one number, equal to its area.",
  defaults: { rows: 10, cols: 10 },
  generate: logic.generate,
  logic,
  render,
};
