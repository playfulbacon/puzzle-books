import * as logic from "./logic.js";
import * as render from "./render.js";
export default {
  id: "gokigen",
  label: "Gokigen Naname",
  japanese: "ごきげんななめ",
  rules: "Draw one diagonal in every cell. A number at a grid point says how many diagonals touch it. The diagonals must never form a closed loop.",
  defaults: { rows: 10, cols: 10 },
  generate: logic.generate,
  logic,
  render,
};
