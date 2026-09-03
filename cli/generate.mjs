#!/usr/bin/env node
// Generate a batch of puzzles as JSON, the shared contract for the review app and the book.
//   node cli/generate.mjs --genre slitherlink --size 10x10 --count 8 --seed 100 --band 3 --out review/data/batches/slitherlink-10x10-b3.json
import { writeFileSync } from "node:fs";
import { GENRES, GENERATOR_VERSION } from "../core/index.js";
import { parseSize } from "../core/lib/grid.js";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true] : null)).filter(Boolean));
const g = GENRES[args.genre];
if (!g) { console.error(`--genre must be one of: ${Object.keys(GENRES).join(", ")}`); process.exit(1); }
if (!args.out) { console.error("--out <file.json> is required"); process.exit(1); }
const [rows, cols] = parseSize(args.size, [g.defaults.rows, g.defaults.cols]);
const count = parseInt(args.count ?? "8", 10), seed0 = parseInt(args.seed ?? "1", 10);
const band = args.band ? parseInt(args.band, 10) : null;
const maxAttempts = args.attempts ? parseInt(args.attempts, 10) : undefined;
const batchName = args.batch || `${g.id}-${rows}x${cols}${band ? "-b" + band : ""}-s${seed0}`;

const puzzles = [];
const t0 = Date.now();
for (let k = 0; k < count; k++) {
  const seed = seed0 + k, t1 = Date.now();
  const p = g.generate({ rows, cols, seed, targetBand: band, ...(maxAttempts ? { maxAttempts } : {}) });
  if (!p) { console.error(`  seed ${seed}: no puzzle within budget, skipped`); continue; }
  p.generator_version = GENERATOR_VERSION;
  puzzles.push(p);
  console.error(`  ${p.id}  band ${p.difficulty.band} (${p.difficulty.label})  clues ${p.stats.clue_count}  ${Date.now() - t1} ms`);
}
const batch = { batch: batchName, generated_at: new Date().toISOString().slice(0, 19) + "Z", generator_version: GENERATOR_VERSION, genre: g.id, puzzles };
writeFileSync(args.out, JSON.stringify(batch, null, 1) + "\n");
console.error(`wrote ${puzzles.length} puzzles to ${args.out} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
