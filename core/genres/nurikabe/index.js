import * as logic from "./logic.js";
import * as render from "./render.js";
export default {
  id: "nurikabe",
  label: "Nurikabe",
  japanese: "ぬりかべ",
  rules: "Shade cells to make one connected sea. Each number sits on an island of exactly that many cells. Islands never touch except at corners, and the sea never fills a 2×2 square.",
  defaults: { rows: 10, cols: 10 },
  generate: logic.generate,
  logic,
  render,
};
