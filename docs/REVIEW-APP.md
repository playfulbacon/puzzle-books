# Review app

A static web app for the curation step (DESIGN-BRIEF §4.3): look at generated puzzles as a contact sheet,
solve any of them interactively, and record approve / maybe / reject with tags, notes, and solve time.

Lives in `review/`. No build step, no framework, no backend. It imports the shared puzzle core
(`core/`) as ES modules, so it needs to be served over HTTP: GitHub Pages, any static host, or locally
with `python3 -m http.server` from the repo root (then open `/review/`). For a double-clickable single
file, run `node cli/bundle.mjs --out build/puzzle-review.html`.

## One-time setup for GitHub Pages

1. Merge this branch to `main`.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push anything under `review/` or `core/` (or run the workflow manually from the Actions tab). The
   workflow `.github/workflows/pages.yml` stages `review/` and `core/` together and deploys them.
4. The app appears at `https://playfulbacon.github.io/puzzle-books/review/` (the site root redirects there).

## Day-to-day flow

```
node cli/generate.mjs --genre slitherlink --size 10x10 --band 3 --count 20 --seed 1000 \
        --out review/data/batches/slitherlink-10x10-b3.json
node cli/pack.mjs                       # bundles all batches into review/data/batches.js
git add review/data && git commit -m "review: add batch slitherlink-10x10-b3" && git push
```

Genres: `slitherlink`, `shikaku`, `nurikabe`, `gokigen`, `hashi`, `masyu`. Bands 1–5 are provisional (see PLAN.md §4).

Open the app, pick the batch, click a puzzle. Solve it if you want to feel the path (the timer starts on
your first entry and is stored with the decision). Press **A / M / R**. The app advances to the next
pending puzzle. Decisions save to the browser instantly.

Getting decisions back into the repo, either:

- **GitHub sync** button → paste a fine-grained personal access token (Contents: read & write, this repo
  only) → *Push this batch*. Writes `review/decisions/<batch>.json` as a commit on the chosen branch. The
  token is kept only in your browser's local storage. *Pull* merges decisions made on another device.
- **Export** → downloads (and copies) the same JSON; commit it by hand.

`review/decisions/*.json` is the source of truth the generator will read when assembling a book:
approved puzzles are eligible, tags and notes feed calibration (DESIGN-BRIEF §4.2, PLAN §4.4).

## Adding a genre

A genre is a folder `core/genres/<name>/` with three files, registered in `core/index.js`:

- `logic.js` — `generate(params)` and `countSolutions(...)` (the uniqueness oracle), plus helpers.
- `render.js` — `svg(puzzle, opts)` (pure string, used by the book), `thumbnail`, `solutionSvg`,
  `mount(el, puzzle, savedState, onChange)` returning a controller with `handleKey(e)`, `check()`,
  `reveal()`, `reset()`, `serialize()`, `progress()`, `destroy()`, and a `hint` string. Optional
  `inputs` declares an on-screen keypad for touch devices.
- `index.js` — id, label, Japanese name, one-paragraph rules, defaults.

The review app and the CLI pick the new genre up from the registry automatically. The renderer's SVG is
the same drawing the book will use, so styling decisions made here carry into print.

## Data contract

Batches are JSON files in `review/data/batches/`, matching PLAN.md §3.5: `{batch, generated_at,
generator_version, puzzles:[…]}`, each puzzle carrying `id, type, seed, params, difficulty, clues, solution,
stats`. Solutions are included so *Check* and *Reveal* work; the app is a private review tool, not a
published puzzle site.

## Decision record

```json
"slitherlink-10x10-s000201": {
  "status": "approved",            // approved | maybe | rejected
  "tags": ["great opening"],
  "notes": "Lovely diagonal cascade after the first hidden single.",
  "solveSeconds": 412,
  "solvedCorrectly": true,
  "decidedAt": "2026-09-03T16:41:02.118Z",
  "batch": "slitherlink-10x10-b3-s200"
}
```
