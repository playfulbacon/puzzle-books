# Japanese Logic Puzzle Book — Planning Document

**Status:** Phase 0 (planning). Nothing is built yet.
**Goal:** Procedurally generate Nikoli-style logic puzzles with controllable difficulty, verified unique
solutions, and lay them out into a print-ready book for print-on-demand (Amazon KDP, IngramSpark, Lulu).

This document covers three things:

1. A catalog of popular Japanese logic puzzles, with rules and a tiered build order.
2. How each puzzle is procedurally generated and verified.
3. How difficulty is measured and controlled.

Book layout and print production get their own document later (see §7 for the short version).
The product vision, the Nikoli/Bellos design principles, and how "charm" is turned into generator
requirements live in [DESIGN-BRIEF.md](DESIGN-BRIEF.md).

---

## 1. Design principles

- **Every puzzle has exactly one solution.** Non-negotiable. A complete "oracle" solver proves uniqueness
  for every puzzle before it is accepted.
- **Every puzzle is solvable by pure deduction** at its stated difficulty. A second, rule-based "human
  solver" must finish the puzzle using only techniques allowed for the target difficulty tier. No guessing
  is ever required, at any tier.
- **Difficulty is measured, not assumed.** The rating comes from what the human solver actually had to do,
  not from clue count or grid size alone.
- **Reproducible.** Each puzzle is fully determined by `(type, parameters, seed, generator_version)`.
  Regenerating a book from its manifest yields byte-identical puzzles.
- **Generation and layout are decoupled.** Generators emit JSON. Renderers turn JSON into SVG. The book
  layout consumes SVG + metadata. Any layer can be swapped.
- **Nikoli aesthetics.** Symmetric clue placement where the genre traditionally uses it, no degenerate
  regions, no trivial puzzles that collapse in one move, and a visible "theme" where achievable.

---

## 2. Puzzle catalog

Grouped into three tiers by (a) popularity with Western solvers, (b) implementation effort, and
(c) how well the generation approach is understood. Tier 1 is the first book; tiers 2 and 3 extend the
library for later books.

### Tier 1 — first book candidates

| # | Puzzle (common English name) | Rules in one breath | Grid | Generation family (§3) |
|---|---|---|---|---|
| 1 | **Sudoku** (Number Place) | Fill 1–9 so each row, column, and 3×3 box has each digit once. | 9×9 (also 6×6, 4×4) | A: solution → clue reduction |
| 2 | **Kakuro** (Cross Sums) | Crossword-shaped grid. Each horizontal/vertical run of white cells sums to its clue; digits 1–9, no repeats within a run. | ~9×9 to 15×15 | A′: shape → fill → all clues fixed |
| 3 | **Nurikabe** | Shade cells to form one connected "sea" with no 2×2 shaded block. Each unshaded island contains exactly one number and has that many cells; islands don't touch orthogonally. | 10×10 to 20×20 | B: structure → clue placement |
| 4 | **Slitherlink** (Fences / Loop the Loop) | Draw a single closed loop along grid lines. A number in a cell says how many of its four edges the loop uses. | 10×10 to 20×20 | B: loop → derive clues → reduce |
| 5 | **Hashiwokakero** (Bridges) | Connect numbered islands with 1 or 2 straight bridges (horizontal/vertical, no crossings) so every island's bridge count matches its number and all islands are connected. | 10×10 to 20×20 | B: islands + graph → all clues fixed |
| 6 | **Hitori** | Grid of numbers. Shade cells so no number repeats in any row or column, no two shaded cells are orthogonally adjacent, and all unshaded cells are connected. | 8×8 to 15×15 | B: shading → fill numbers |
| 7 | **Masyu** (Pearls) | Single closed loop through cell centers. White pearl: pass straight through, and turn in at least one neighboring cell. Black pearl: turn here, and go straight through both adjacent cells. | 10×10 to 15×15 | B: loop → eligible pearls → reduce |
| 8 | **Shikaku** (Rectangles / Divide by Box) | Partition the grid into rectangles, each containing exactly one number equal to its area. | 10×10 to 15×15 | B: partition → clue placement |
| 9 | **Akari** (Light Up) | Place light bulbs in white cells so every white cell is lit (bulbs shine orthogonally until a black cell) and no bulb lights another. Numbered black cells count orthogonally adjacent bulbs. | 10×10 to 14×14 | C: rooms/walls → solve → clue reduction |
| 10 | **Futoshiki** (Unequal) | Latin square (1–N per row/column) with inequality signs between some cells. | 5×5 to 9×9 | A: solution → clue reduction |
| 11 | **KenKen / Kashikoku-naru** (Calcudoku) | Latin square with cages; each cage shows a target and an operation (+ − × ÷) its digits must produce. | 4×4 to 9×9 | A + partition |

### Tier 2 — second wave

| # | Puzzle | Rules in one breath | Generation family |
|---|---|---|---|
| 12 | **Fillomino** | Fill every cell with a number so each orthogonally connected region of equal numbers has exactly that many cells; equal-size regions may not touch. | B: polyomino partition → reduce |
| 13 | **Heyawake** (Divided Rooms) | Bold-outlined rooms; numbers say how many cells in the room are shaded. Shaded cells never touch orthogonally, unshaded cells are all connected, and no straight unshaded line may pass through more than two rooms. | C: rooms → solve → reduce |
| 14 | **Numberlink** (Arukone) | Connect each pair of matching numbers with a path; paths don't cross or share cells. Convention: every cell is used. | B: path decomposition |
| 15 | **LITS** | Shade one tetromino in each region so all shaded cells connect, no 2×2 block is shaded, and same-shaped tetrominoes never touch across a border. | C: regions → solve (no removable clues) |
| 16 | **Yajilin** (Arrow Ring) | Gray clue cells with an arrow and number count the shaded cells in that direction. Shaded cells don't touch; a single loop passes through every remaining cell. | B/C hybrid |
| 17 | **Nonogram** (Picross / Hanjie / Griddlers) | Row and column clues list the lengths of consecutive shaded runs in order. Solution is usually a picture. | A′: image → all clues fixed |
| 18 | **Kuromasu** (Kurodoko) | Numbered cells are white and count the white cells visible from them in four directions (including themselves). Shaded cells don't touch; white cells are connected. | B: shading → visibility clues → reduce |
| 19 | **Suguru** (Tectonic / Number Blocks) | Irregular regions of 1–5 cells contain 1..n; identical numbers may not touch, even diagonally. | A + partition |
| 20 | **Ripple Effect** (Hakyuu) | Regions of size n contain 1..n. Two equal numbers k in a row or column must have at least k cells between them. | A + partition |
| 21 | **Tentai Show** (Spiral Galaxies) | Dots on cell centers, edges, or corners. Divide the grid into regions, each 180°-rotationally symmetric about exactly one dot. | B: dots → symmetric growth (no removable clues) |

### Tier 3 — library expansion

Shakashaka, Country Road, Norinori, Gokigen Naname (Slant), Kakurasu, Cave / Bag (Corral),
Nurimisaki, Sashigane, Mochikoro, Kurotto, Hebi (Snake), Inshi no Heya, Killer Sudoku and other Sudoku
variants. All fit one of the families below; they are deferred only for effort/popularity reasons.

**Not Japanese, deliberately excluded from a "Japanese puzzles" book:** Star Battle (Dutch), Tapa (Turkish),
Yin-Yang, Hidato (Israeli), Kropki. Could appear in a "world logic puzzles" title later.

### Naming note

Several of these names are Nikoli trademarks in Japan and some elsewhere (e.g. Nikoli holds marks on
"Nurikabe", "Slitherlink", "Masyu", "Hitori" in various jurisdictions; "Sudoku" is generic in the US).
The *rules* of a puzzle type are not protectable, and generic English names ("Bridges", "Light Up",
"Rectangles", "Cross Sums", "Fences", "Pearls") are widely used by other publishers. Decide the naming
policy before cover design; this is a business decision, not a technical one, and worth a quick check
with someone who knows trademark law in the target markets.

---

## 3. Generation architecture

### 3.1 The universal pipeline

Every puzzle type goes through the same five stages. Only stages 1 and 2 are genre-specific.

```
 ┌────────────────────┐   ┌─────────────────┐   ┌───────────────┐   ┌──────────────┐   ┌────────────┐
 │ 1. Build solution  │ → │ 2. Derive clues │ → │ 3. Reduce /   │ → │ 4. Rate      │ → │ 5. Accept  │
 │    structure       │   │    (full set)   │   │    perturb    │   │   difficulty │   │   or retry │
 └────────────────────┘   └─────────────────┘   └───────────────┘   └──────────────┘   └────────────┘
        seeded RNG            deterministic       oracle solver in      human solver     bucket into
        + parameters                              the loop (unique?)    (technique       target tier
                                                                        trace)
```

- **Stage 1** produces a complete, valid *solution* (a filled grid, a loop, a shading, a partition).
- **Stage 2** computes every clue the solution supports (all Slitherlink numbers, every pearl position
  that satisfies Masyu rules, every island's bridge count, …).
- **Stage 3** removes clues one at a time (random order, or difficulty-guided order) and keeps a removal
  only if the puzzle remains unique. For genres where clues can't be removed (Kakuro sums, Hashi numbers,
  LITS/Tentai Show geometry), this stage instead *perturbs the structure* until uniqueness holds.
- **Stage 4** runs the human solver, produces a technique trace, maps it to a rating, and scores the
  *shape* of the solving path (opening width, ramp, breakthroughs, stall depth; see DESIGN-BRIEF §4.2).
- **Stage 5** accepts the puzzle if it lands in the requested tier *and* passes the path-shape and visual
  gates, else adjusts (add a clue back, remove more, or discard and reseed).
- **Stage 6 (curation)** renders a contact sheet of accepted candidates per book slot; a human picks.
  This is where taste enters and is deliberately cheap.

### 3.2 Three generation families

**Family A — Solution first, then clue reduction.** (Sudoku, Futoshiki, KenKen, Suguru, Ripple Effect,
Fillomino, Kakuro-fill.) Fill a grid with a randomized backtracking solver, then reduce. The best-understood
family; Sudoku literature covers it exhaustively.

**Family B — Random structure, then derive clues.** (Slitherlink, Masyu, Nurikabe, Shikaku, Hashi, Hitori,
Numberlink, Kuromasu, Tentai Show, Yajilin.) The solution is a geometric object. The art is in generating
*interesting* random structures:

- *Random simple loops* (Slitherlink, Masyu, Yajilin, Country Road): grow an "inside" region cell by cell.
  Its boundary is a single simple loop iff the region is 4-connected, its complement is 4-connected, and no
  2×2 block has a checkerboard pattern. Add/remove cells while preserving those invariants; tune a
  "wiggliness" parameter for how much the loop meanders. Masyu needs the loop through cell centers, so use
  the same idea on the cell graph or generate a random cycle and mutate it.
- *Random partitions* (Shikaku, Fillomino, LITS, Suguru, KenKen cages, Heyawake rooms): recursive
  guillotine splits for rectangles; seeded region growth with target size distributions for polyominoes.
- *Random shadings with connectivity* (Nurikabe, Hitori, Kuromasu, Heyawake): grow islands from random
  seeds against a sea, re-checking sea connectivity and the 2×2 rule; or start from a valid trivial state
  and apply random local moves that preserve the invariants (Markov chain style).
- *Random planar graphs* (Hashi): scatter islands, build a random spanning tree with orthogonal
  non-crossing edges, add extra edges and double bridges until the degree distribution matches the target.

**Family C — Constraint search generation.** (Akari, Heyawake, LITS.) The solution must satisfy global
constraints that are hard to construct directly, so: build the *frame* (walls, rooms), then use the oracle
solver itself with a randomized value order to find *some* valid solution, then derive clues from it.

### 3.3 The oracle solver

One per genre, optimized for a single question: *does this puzzle have exactly one solution?*
Stop as soon as a second solution is found.

Recommended implementation: **SAT** via `python-sat` (CaDiCaL / Glucose backends), or **OR-Tools CP-SAT**.

- Local constraints (counts, Latin rules, adjacency) encode directly into clauses.
- Global constraints (single loop, connected sea, connected unshaded cells) are handled **lazily**: solve
  without the connectivity constraint, inspect the model, and if it contains a disconnected component or a
  second loop, add a clause forbidding that specific component and re-solve. This converges fast for grids
  up to ~20×20 and is the standard approach in the puzzle-solving literature.
- CP-SAT's `AddCircuit` is an alternative for loop genres.
- For Sudoku specifically, a bitmask backtracker or Dancing Links (DLX) is faster than SAT and trivially
  counts solutions.

A hand-written DFS with propagation is fine as a first implementation for 10×10 grids and doubles as a
reference implementation for tests. Swap in SAT when generation throughput matters.

### 3.4 The human solver

One per genre. A **technique ladder**: an ordered list of deduction rules, cheapest first. The solver
repeatedly applies the *lowest-tier* rule that makes progress and logs `(tier, rule, cells affected)`.
It never guesses. If no rule applies, the puzzle is "stuck at tier T" — it needs a technique above the
allowed ceiling.

This is the single most important piece for difficulty control, and the most labor-intensive: each genre
needs 8–20 rules with well-chosen tiers. Sudoku's ladder is well-documented (Sudoku Explainer / HoDoKu
ratings); the others follow the same pattern from published solving guides and Nikoli's own hints.

Example ladders (abbreviated):

- **Sudoku:** naked single → hidden single → box/line (pointing pairs) → naked pair/triple → hidden pair/
  triple → X-wing → XY-wing, W-wing → swordfish → unique rectangle → simple coloring / chains → ALS,
  forcing nets (top tier, "diabolical").
- **Slitherlink:** 0-cells; 3-3 adjacent, 3-3 diagonal, 3 in corner, 1 in corner, 0 next to 3 → line-
  continuation at dots (degree 0 or 2 at every vertex) → 2-cell patterns → premature-loop avoidance → inside/
  outside parity coloring → short chains ("if this edge, then contradiction within 3 steps").
- **Nurikabe:** complete islands & surround → cells adjacent to two different islands are sea → 2×2 sea
  prevention → unreachable cells are sea → island must expand its only way → sea connectivity forcing →
  reachability with contested cells → chains.
- **Masyu:** black pearl on edge/near edge; white pearls in a row of three → forced straights → loop
  degree at each cell → premature loop closure → parity / region arguments.
- **Hitori:** "aba" in a line ⇒ middle unshaded; "aa" ⇒ all other a's in line shaded; corner patterns →
  adjacency (shading one forces neighbors unshaded) → connectivity (don't cut off a region) → chains.
- **Hashi:** 8 anywhere / 6 on edge / 4 in corner fully forced → "n with only n possible bridge slots" →
  1-1 and 2-2 isolation rules → connectivity (an island group must reach the rest) → chains.
- **Shikaku:** clue whose only rectangle fits → cells coverable by only one clue → prime numbers (1×n
  strips) → cells no clue can reach must be claimed → mutual exclusion between two clues.
- **Akari:** number equals free neighbors → 0s → cell lit from only one possible position → bulb
  exclusion by numbered cells → "a bulb here would leave X unlightable" → chains.

Tiers are per-genre but map to a common 5-band scale (§4).

### 3.5 Puzzle data format

Generators emit one JSON document per puzzle. Rough schema:

```json
{
  "id": "nurikabe-10x10-s000123-v1",
  "type": "nurikabe",
  "generator_version": "1.0.0",
  "seed": 123,
  "params": {"rows": 10, "cols": 10, "target_tier": 3},
  "difficulty": {"band": 3, "label": "Hard", "score": 41.5,
                 "max_tier": 5, "technique_counts": {"island_complete": 12, "unreachable": 4, "...": 0}},
  "clues": {"...genre-specific..."},
  "solution": {"...genre-specific..."},
  "stats": {"clue_count": 14, "solve_steps": 87}
}
```

A book manifest lists puzzle ids in page order with their assigned book-level numbers. The renderer
produces `puzzle.svg` and `solution.svg` for each id; the layout stage never touches the JSON directly.

---

## 4. Difficulty control

### 4.1 What "difficulty" means here

Difficulty is defined by the **technique trace** from the human solver. The rating function is
SE-style: the hardest technique required sets the band; the number of hard steps and the number of
"stall points" (moments where only one deduction was available anywhere on the grid) positions the puzzle
within the band.

```
score = max_tier * 10
      + Σ_over_steps  weight(tier(step))          (weights grow geometrically by tier)
      + stall_bonus * count(single-move states)
```

Five common bands across all genres:

| Band | Label (working) | Meaning |
|---|---|---|
| 1 | Gentle | Only tier-1 rules. Every step is a direct consequence of a clue. |
| 2 | Easy | Tier-1–2 rules. Simple local patterns and counting. |
| 3 | Medium | Introduces the genre's "signature" technique (e.g. Nurikabe unreachability, Slitherlink parity). |
| 4 | Hard | Multiple interacting techniques; frequent stall points. |
| 5 | Expert | Requires the top tier: short contradiction chains (still not guessing, depth ≤ 2–3). |

Names are placeholders; the book's final labels are a design decision.

### 4.2 Knobs that steer difficulty

Difficulty is *measured* after generation, but these parameters *bias* generation toward a target so the
acceptance rate stays reasonable:

| Knob | Effect | Applies to |
|---|---|---|
| Grid size | More cells = longer solve, more room for hard interactions | All |
| Clue density (target) | Fewer clues → harder, up to the uniqueness floor | A, B families |
| Clue-removal order | Random = neutral. Remove clues the human solver used earliest → harder. Keep "anchor" clues → easier. | A, B |
| Technique ceiling | Reject any removal that pushes max_tier above the target | All |
| Structure parameters | Loop wiggliness, island size distribution, room sizes, bridge degree mix, number magnitude in Shikaku (primes easy, highly-composite hard) | B, C |
| Symmetry | 180° rotational clue symmetry (Nikoli style) usually *raises* difficulty slightly because fewer clue sets are available | Sudoku, Kakuro, Akari, Heyawake |
| Bifurcation ban | Always on: puzzles the human solver cannot finish at Band 5 are discarded, never published | All |

### 4.3 The steering loop

```
for attempt in range(max_attempts):
    solution  = build_structure(seed, params_for(target_band))
    clues     = derive_all_clues(solution)
    puzzle    = reduce(clues, oracle, human_solver, target_band)   # removal guided by ceiling
    rating    = human_solver.rate(puzzle)
    if rating.band == target_band and rating.finished:
        return puzzle
    seed = next_seed(seed)
```

`reduce` tries removing clues in an order chosen for the target. After each tentative removal it checks
(a) still unique (oracle) and (b) human solver still finishes with `max_tier <= ceiling(target_band)`.
For hard targets it additionally prefers removals that *increase* the score. Acceptance rates per band
are logged so parameters can be tuned; expect 20–60% acceptance for middle bands and lower at extremes.

### 4.4 Calibration

Technique tiers are a hypothesis about human difficulty. Validate them:

1. Time yourself (and a few test solvers) on 5 puzzles per band per genre.
2. Check that median solve time increases monotonically with band and that no band-2 puzzle needed a
   "trick" the solver wouldn't consider easy.
3. Adjust tier assignments and weights; regenerate. Ratings are metadata, so re-rating a book is cheap.

### 4.5 Quality gates beyond difficulty

Path-shape metrics (opening width, ramp position, breakthrough count, stall depth, finish cascade, tier
variety) are defined with targets in DESIGN-BRIEF §4.2 and enforced here. Generated puzzles are also
rejected for:

- Trivial collapse (more than ~40% of the grid is forced by tier-1 rules in one sweep) at bands ≥ 3.
- Degenerate structure: Shikaku with all 1×n strips, Nurikabe with all size-1 islands, Slitherlink loops
  that hug the border, Hashi with all-2 islands.
- Clue clustering (all clues in one quadrant), measured by a simple dispersion statistic.
- Duplicate or near-duplicate puzzles within a book (canonical form under rotation/reflection hashed).

---

## 5. Recommended technology

| Layer | Choice | Why |
|---|---|---|
| Language | **JavaScript (ES modules), no build step** | One codebase runs in Node for batch generation and in the browser for the review site, so there is a single source of truth for generating, verifying, and drawing every genre. V8 is fast enough for 10×10–15×15 grids with custom propagation solvers. (Decision taken 2026-09-03; replaces the earlier Python recommendation.) |
| Oracle solver | Hand-written propagation + DFS per genre in `core/genres/<genre>/logic.js`, with a search budget | Proves uniqueness; also yields a provisional difficulty signal (branch count). A SAT/WASM backend can be swapped in per genre later without changing the JSON contract. |
| Human solver | Per-genre rule modules in the same core (to be written) | Needs to be readable and auditable; each rule is a small function with a tier. |
| Tests | Node test runner, soak tests per genre | Every rule gets a positive and a negative test; every genre gets a "N random puzzles are unique and solvable" soak test. |
| Rendering | SVG strings from `core/genres/<genre>/render.js` | The same drawing code serves the review site (interactive) and the book (static). Vector = crisp at any print resolution. |
| Layout (later) | **Typst** as first choice; HTML+CSS via Paged.js/WeasyPrint or InDesign as alternatives | Typst is programmatic, fast, produces PDF with embedded fonts, and has good print controls. Decide in the layout phase. |
| Parallelism | `multiprocessing` pool per genre | Hundreds of puzzles per book, minutes to hours overnight is fine. |

CLI (implemented):

```
node cli/generate.mjs --genre nurikabe --size 10x10 --band 3 --count 40 --seed 1000 --out review/data/batches/nurikabe-10x10-b3.json
node cli/pack.mjs                                   # bundles batches for the review site
node cli/render.mjs review/data/batches/<batch>.json --out build/svg --cell 54   # SVGs for the book
node cli/bundle.mjs --out build/puzzle-review.html  # single-file review app
```

Repository layout:

```
puzzle-books/
  docs/                 planning, design brief, review-app guide
  core/
    index.js            genre registry (the single import for CLI, site, and book)
    lib/                seeded RNG, grid helpers, SVG style, provisional difficulty
    genres/<name>/      logic.js (generate + oracle)  render.js (svg + interactive mount)  index.js
  cli/                  generate, pack, render, bundle
  review/               static review site (imports ../core directly)
  book/layout-studies/  page layout options (design canvas working files)
  build/                generated output (gitignored)
```

### Genre status

| Genre | Generate | Unique | Sizes that work | Notes |
|---|---|---|---|---|
| Slitherlink | yes | yes | 6×6–10×10 | Clue density steered by band; rating is density-based until the technique solver exists. |
| Shikaku | yes | yes | 8×8–12×12 | Fast; numbers relocated within rectangles until unique. |
| Nurikabe | yes | yes | 7×7–8×8 reliably; 10×10 slow (about a third of structures converge) | Solve-and-patch generation. Needs a stronger propagation set or a constructive generator for 10×10 and up. |

---

## 6. Build order and milestones

**Milestone 1 — Framework + one genre end to end (Sudoku).**
Grid model, JSON schema, CLI, DLX oracle, full technique ladder, rating, path-shape metrics from the trace,
symmetric clue-orbit reduction, SVG render, contact-sheet renderer for curation, soak test.
Sudoku first because the ladder is well-documented, so it validates the rating architecture against known
ground truth (compare against SE/HoDoKu ratings of published puzzles).

**Milestone 2 — Loop and shading machinery (Slitherlink, Nurikabe).**
Random-loop generator, SAT oracle with lazy connectivity, two human solvers. This unlocks most of Family B.

**Milestone 3 — Fill out Tier 1.** Hashi, Masyu, Hitori, Shikaku, Akari, Kakuro, Futoshiki, KenKen.
Each is 1–3 days once the shared machinery exists; Akari and Kakuro are the longest.

**Milestone 4 — Calibration pass.** Solve test sets, adjust tiers, lock `generator_version 1.0`.

**Milestone 5 — Layout & print pipeline.** Separate plan; see §7.

**Milestone 6 — Volume 1.** Generate, assemble, proof, publish. Then Tier 2 genres for Volume 2.

---

## 7. Print production (preview; full plan later)

Constraints that affect puzzle design *now*, so we don't paint ourselves into a corner:

- **Trim size.** Puzzle books sell well at 8.5×11" and 8×10"; 6×9" works for Sudoku/Futoshiki but is
  cramped for 15×15+ grids. Grid cell size should be ≥ 7 mm for pencil solving; this caps grid dimensions
  per trim size and should feed into the per-genre size defaults.
- **Interior.** Black & white interior is cheapest and looks best for logic puzzles. Design in pure black
  plus one or two grays; avoid thin hairlines below 0.25 pt. All art as vector.
- **PDF.** Fonts embedded, PDF/X-1a or PDF/X-4 for IngramSpark; KDP accepts plain PDF. No bleed needed
  unless art runs to the page edge. Inside margins scale with page count (KDP: 0.375" up to 150 pages,
  0.5" to 300, 0.625" to 500, 0.75" to 700).
- **Solutions.** Traditionally at the back, smaller scale; the renderer already produces `solution.svg`.
- **Page count.** KDP b/w max is 828 pages; a 200-puzzle variety book with solutions lands around 220–260.

---

## 8. Open decisions (need your call)

1. **Volume 1 format:** single-genre (e.g. "200 Nurikabe") or a variety collection across Tier 1?
   Recommendation: a variety book of 8–10 genres with a rules page per genre. It is more distinctive and
   showcases the system, though single-genre titles are easier to find by search. We can do both later.
2. **Genre naming policy** (§2, naming note): Japanese names, English names, or both on the page?
3. **Difficulty labels** for the book: stars, words, or a Japanese-flavored scale?
4. **Trim size** target, since it constrains the largest grids we generate.
5. **Language/stack** confirmation: Python + SAT for generation, Typst as the layout candidate.
6. **Product format:** "A Year of Puzzles" (365, one per page, weekly difficulty ramp), seasonal volumes,
   or a conventional collection. See DESIGN-BRIEF §5; recommendation is the year format.

Everything else in this document is a recommendation we can start executing on without further input.
