import * as logic from "./logic.js";
import * as render from "./render.js";
export default {
  id: "masyu",
  label: "Masyu",
  japanese: "ましゅ",
  rules: "Draw one loop through the centres of cells. Pass straight through white pearls and turn in the cell before or after. Turn at black pearls and go straight through both neighbouring cells.",
  defaults: { rows: 10, cols: 10 },
  generate: logic.generate,
  logic,
  render,
};
