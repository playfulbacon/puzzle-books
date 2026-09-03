#!/usr/bin/env node
// Render every puzzle in a batch to SVG files (puzzle + solution) for the book layout.
//   node cli/render.mjs review/data/batches/slitherlink-10x10-b3.json --out build/svg --cell 54
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { GENRES } from "../core/index.js";
const [file, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const out = opt.out || "build/svg", cell = parseFloat(opt.cell || "40");
mkdirSync(out, { recursive: true });
const batch = JSON.parse(readFileSync(file, "utf8"));
for (const p of batch.puzzles) {
  const g = GENRES[p.type];
  writeFileSync(join(out, `${p.id}.svg`), g.render.svg(p, { cell }));
  writeFileSync(join(out, `${p.id}.solution.svg`), g.render.solutionSvg(p, { cell }));
}
console.log(`rendered ${batch.puzzles.length} puzzles to ${out}/`);
