# Review app

A static web app for the curation step (DESIGN-BRIEF §4.3): look at generated puzzles as a contact sheet,
solve any of them interactively, and record approve / maybe / reject with tags, notes, and solve time.

Lives in `review/`. No build step, no framework, no backend. Runs from GitHub Pages, from a local
double-click on `review/index.html`, or from any static host.

## One-time setup for GitHub Pages

1. Merge this branch to `main`.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push anything under `review/` (or run the workflow manually from the Actions tab). The workflow
   `.github/workflows/pages.yml` uploads the `review/` folder and deploys it.
4. The app appears at `https://playfulbacon.github.io/puzzle-books/`.

## Day-to-day flow

```
python -m puzzlegen.sudoku --count 40 --seed 1000 --band 2 --batch sudoku-b2-1000 \
        --out review/data/batches/sudoku-b2-1000.json
python tools/pack_review_data.py        # bundles all batches into review/data/batches.js
git add review/data && git commit -m "review: add batch sudoku-b2-1000" && git push
```

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

Each genre is one file in `review/renderers/` that registers itself on `window.PuzzleRenderers[type]`
with two functions:

- `thumbnail(puzzle)` → SVG string of the unsolved grid.
- `mount(el, puzzle, savedState, onChange)` → a controller with `handleKey(e)`, `check()`, `reveal()`,
  `reset()`, `serialize()`, `progress()`, `destroy()`.

See `renderers/sudoku.js`. Add a `<script>` tag for the new file in `index.html`. The renderer's SVG is the
same drawing the book will use, so styling decisions made here carry into print.

## Data contract

Batches are JSON files in `review/data/batches/`, matching PLAN.md §3.5: `{batch, generated_at,
generator_version, puzzles:[…]}`, each puzzle carrying `id, type, seed, params, difficulty, clues, solution,
stats`. Solutions are included so *Check* and *Reveal* work; the app is a private review tool, not a
published puzzle site.

## Decision record

```json
"sudoku-9x9-s000201-v0.1.0": {
  "status": "approved",            // approved | maybe | rejected
  "tags": ["great opening"],
  "notes": "Lovely diagonal cascade after the first hidden single.",
  "solveSeconds": 412,
  "solvedCorrectly": true,
  "decidedAt": "2026-09-03T16:41:02.118Z",
  "batch": "sudoku-easy-sample"
}
```
