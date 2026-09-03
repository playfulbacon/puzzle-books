import * as logic from "./logic.js";
import * as render from "./render.js";
export default {
  id: "slitherlink",
  label: "Slitherlink",
  japanese: "スリザーリンク",
  rules: "Connect the dots to draw a single loop. A number says how many of the four sides around it the loop uses. The loop never crosses itself or branches.",
  defaults: { rows: 10, cols: 10 },
  generate: logic.generate,
  logic,
  render,
};
