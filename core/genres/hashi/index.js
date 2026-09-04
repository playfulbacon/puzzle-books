import * as logic from "./logic.js";
import * as render from "./render.js";
export default {
  id: "hashi",
  label: "Hashiwokakero",
  japanese: "橋をかけろ",
  rules: "Connect the islands with straight bridges, one or two between any pair, running horizontally or vertically without crossing. Each island's number is its bridge count, and every island must be reachable from every other.",
  defaults: { rows: 10, cols: 10 },
  generate: logic.generate,
  logic,
  render,
};
