# Design Brief — What the book is for, and what "charm" means in code

Companion to [PLAN.md](PLAN.md). PLAN.md says *how* puzzles get generated; this document says *what we are
trying to make* and turns the inspirations into requirements the generator, curator, and layout must meet.

---

## 1. The product in one paragraph

A beautiful book of Japanese logic puzzles for a quiet morning. You open it with coffee, do one puzzle,
close it. It should feel closer to a well-made notebook or a Nikoli magazine than to the dense, utilitarian
puzzle books that dominate print-on-demand. The puzzles are varied (many genres), fair (unique, no
guessing), and paced (a gentle start, a breakthrough, a satisfying finish).

## 2. What we're reacting to

**Existing print-on-demand variety books** (e.g. *300+ Japanese Logic Puzzles for Adults: 13 Varieties*,
*Pappy's Nikoli Style Puzzle Book*, *The Peaceful Mind Book of Japanese Logic Puzzles*) prove the
demand: a mixed collection of Nikoli-style genres, marketed to adults. They also share the same weaknesses,
which are our opening:

- Puzzles are packed several to a page to hit a "300+" count; grids are small, margins thin.
- Default fonts and hairline grids; no typographic hierarchy; solutions crammed at the back in tiny type.
- Difficulty labels that don't correspond to a real solving experience.
- Puzzles that are obviously machine-output: asymmetric clue scatter, no theme, flat solving paths.

**Nikoli** is the reference for what the puzzles themselves should feel like. Their stated position, from
their own "Why hand made" page, is that computer-generated puzzles are inferior because they lack "the
sense of communication between solver and author." Specifically they name:

1. **Symmetry of givens** as a foundational aesthetic principle ("a beautiful idea"; "good taste").
2. **The solving process over the result**: good puzzles are "absorbing, never boring," "make you
   concentrate, but aren't stressful."
3. **Natural progression**: computer puzzles "force solvers into complex deductions immediately"; hand-made
   ones open gently and build.
4. **Consideration of the solver's feelings**: the author anticipates where you'll look next.
5. **Theme**: clue layouts that form shapes, letters, or kanji; solutions that make a picture.

**Alex Bellos** (*Puzzle Ninja*, 2017) makes the same case from the outside. His thesis: in Japan, logic
puzzles are treated as an art form, made by named setters with recognizable personal styles, and valued
for aesthetic as well as mathematical beauty. The charm is the *setter's presence* in the puzzle, the
elegance of minimal rules, and the visual pleasure of geometry, both in the clue layout and the solved grid.
Thomas Snyder (GM Puzzles), who learned from Nikoli, distills it as "simple, elegant, and visually
interesting designs."

## 3. The tension we have to resolve

We are building a procedural generator. Nikoli's entire brand is that procedural generation can't produce
puzzles worth solving. They are partly right: a naive generator (random solution, greedy clue removal,
accept-if-unique) produces exactly the flat, themeless puzzles they describe.

Our position: the qualities Nikoli names are *describable*, and anything describable can be measured and
optimized for. Symmetry is a constraint. "Gentle opening" is a property of the human-solver trace. "Not
stressful" is an upper bound on stall depth. "Theme" is a clue-mask chosen before reduction. Where a
quality resists measurement, a human (you) curates from candidates. The book is honestly described as
computer-generated and hand-selected. We don't claim hand-made.

This reframes the generator's job. It is not "produce unique puzzles." It is "produce puzzles a Nikoli
setter would not be embarrassed by," with a curator making the final cut.

## 4. Charm, operationalized

Each quality below becomes a hard constraint, a scored metric, or a curation step. These extend §4.5 of
PLAN.md.

### 4.1 Symmetry (hard constraint where the genre uses it)

- Sudoku, Kakuro grid shape, Akari black cells, Heyawake rooms, Hitori's shading pattern where feasible:
  180° rotational symmetry of the clue mask, optionally mirror or 4-fold.
- Loop and region genres (Slitherlink, Masyu, Nurikabe, Shikaku): symmetry is optional but the
  generator offers a "symmetric clue mask" mode that removes clues in symmetric pairs.
- Implementation: choose the symmetry group before reduction; remove clues in orbits, not singly.

### 4.2 Solving-path shape (scored)

From the human-solver trace, compute:

| Metric | Definition | Target |
|---|---|---|
| **Opening width** | Number of independent tier-1 deductions available at the start | ≥ 3 (there is always somewhere obvious to begin) |
| **Ramp** | Position (0–1 through the solve) of the first step at the puzzle's max tier | 0.25–0.6 (the hard bit comes after you've warmed up, not first and not last) |
| **Breakthrough count** | Steps where available deductions drop to 1 then reopen to ≥ 3 | 1–3 (the "aha" moments; too many is a slog) |
| **Stall depth** | Max consecutive single-option steps | ≤ 4 at bands 1–3; ≤ 8 at 4–5 |
| **Finish** | Fraction of grid resolved by tier-1 cascade after the last max-tier step | ≥ 0.3 (the ending flows) |
| **Tier variety** | Number of distinct techniques used | ≥ 3 at band ≥ 3 |

A puzzle that satisfies uniqueness and band but scores poorly on path shape is *rejected*, and the
generator reseeds. This is the direct answer to "computer puzzles force complex deductions immediately."

### 4.3 Visual quality of the grid (scored + curated)

- **Clue dispersion**: no quadrant holds more than 40% of clues; no clue-free rows/columns band.
- **Solution beauty**: for loop genres, penalize border-hugging and long straight runs; reward loops
  whose inside region has a pleasing convex-ish silhouette. For Nurikabe, reward varied island sizes and a
  sea that reads as a shape. For Shikaku, reward mixed aspect ratios.
- **Number palette**: limit distinct clue values per puzzle where it helps legibility (e.g. Slitherlink
  puzzles using only 2s and 3s read cleaner than a scatter of 0–3).
- **Thumbnails for curation**: the render stage produces a contact sheet of 50 candidates per slot; you
  pick. This is where taste enters, cheaply.

### 4.4 Theme (optional, high value)

- **Clue-mask themes**: before reduction, constrain the set of allowed clue positions to a shape (a
  diamond, a spiral, a kanji, the puzzle's number). Reduction then only ever removes from within the mask.
  Acceptance rates drop; that's fine for a handful of showpiece puzzles per book.
- **Solution themes**: for Nonogram this is the whole point (pixel art, seasonal motifs). For Nurikabe
  and Slitherlink, seed the structure generator with a target silhouette and let it perturb toward it.
- Budget: a few themed puzzles per volume, flagged in the manifest, given the best pages.

### 4.5 Minimal rules, clearly taught

Bellos and Nikoli both emphasize rules that fit in two sentences. The book teaches each genre with:
one rules paragraph, one tiny worked example (3 to 4 deductions, illustrated), one pointer to the
signature technique. No pages of tutorial. The plan's one-line rule statements in PLAN.md §2 are the draft.

## 5. Product format options for a "morning ritual"

The morning-routine framing suggests a structure, not just a style. Options, with a recommendation:

**A. A Year of Puzzles (recommended).** 365 puzzles, one per page, numbered by day (undated so the book
never expires). Difficulty follows the week like the NYT crossword: gentle Monday through hard Saturday,
Sunday a large showpiece. Genres rotate so the week stays varied. This turns the "300+" quantity claim
into a ritual with a story, and the weekly ramp is something our difficulty engine can guarantee.
Roughly 365 puzzle pages + ~30 solution pages + front matter ≈ 410 pages, within KDP's 828-page limit;
solutions at 6-per-page keep the back matter honest.

**B. Seasons.** Four volumes of ~90 puzzles, each with a seasonal theme in the artwork and themed
puzzles. Smaller, prettier objects; more SKUs to manage.

**C. Single-sitting collections.** 100 puzzles, one genre family per chapter. Closest to the existing
market; least distinctive.

Whichever we choose, the layout principle is the same: **one puzzle per page, the grid as the hero,
generous white space, solution elsewhere.** Density is the enemy of the ritual.

## 6. What this changes in PLAN.md

- §3.1 gains a *path-shape scoring* step inside stage 4 and a *curation* step after stage 5.
- §4.5 quality gates expand into the metrics in §4.2–4.3 above.
- §6 milestones: Milestone 1 should build the trace-metric framework alongside the rating, since every
  genre depends on it. Add a *contact-sheet renderer* to Milestone 1 so curation starts with Sudoku.
- §8 open decisions: add "product format (A/B/C above)."

## Sources

- Nikoli, "Why hand made": https://www.nikoli.co.jp/en/puzzles/sudoku/why_hand_made/
- Alex Bellos, *Puzzle Ninja: Pit Your Wits Against the Japanese Puzzle Masters* (Guardian Faber, 2017)
- Thomas Snyder, "Wordoku, in memory of Maki Kaji" (GM Puzzles, 2021):
  https://www.gmpuzzles.com/blog/2021/08/wordoku-in-memory-of-maki-kaji/
- Anthony Fergarson, *300+ Japanese Logic Puzzles for Adults: With 13 Different Varieties of Brain Teaser*
  (KDP, 2021), ISBN 9798784103130
