#!/usr/bin/env node
// Build the review app into one self-contained HTML file (esbuild inlines the core modules).
//   node cli/bundle.mjs --out build/puzzle-review.html [--fragment]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), out = args[args.indexOf("--out") + 1] || "build/puzzle-review.html", fragment = args.includes("--fragment");
const js = execSync(`npx -y esbuild@0.24.2 review/app.js --bundle --format=iife --log-level=error`, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
let html = readFileSync(join(ROOT, "review/index.html"), "utf8");
const inline = (rel) => readFileSync(join(ROOT, "review", rel), "utf8");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/, (_, f) => `<style>\n${inline(f)}\n</style>`);
html = html.replace(/<script src="data\/batches.js"><\/script>/, () => `<script>\n${inline("data/batches.js").replace(/<\/script/g, "<\\/script")}\n</script>`);
html = html.replace(/<script type="module" src="app.js"><\/script>/, () => `<script>\n${js.replace(/<\/script/g, "<\\/script")}\n</script>`);
if (fragment) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta [^>]+>\s*/g, "").trim();
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].trim();
  html = head + "\n" + body + "\n";
}
mkdirSync(dirname(join(ROOT, out)), { recursive: true });
writeFileSync(join(ROOT, out), html);
console.log(`wrote ${out} (${Math.round(html.length / 1024)} KB)`);
