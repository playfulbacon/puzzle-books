# puzzle-books

Procedurally generated Japanese logic puzzles (Nikoli-style) with verified unique solutions and
measured difficulty, laid out into print-ready books for print-on-demand publishing.

Start with [docs/PLAN.md](docs/PLAN.md): the puzzle catalog, generation architecture, and
difficulty-control design.

## Quick start

```
node cli/generate.mjs --genre slitherlink --size 10x10 --band 3 --count 8 --seed 1 --out review/data/batches/demo.json
node cli/pack.mjs
python3 -m http.server 8000      # then open http://localhost:8000/review/
```

Genres so far: Slitherlink, Shikaku, Nurikabe, Gokigen Naname, Hashiwokakero, Masyu. See [docs/REVIEW-APP.md](docs/REVIEW-APP.md) for the
review workflow and [docs/DESIGN-BRIEF.md](docs/DESIGN-BRIEF.md) for what the book is trying to be.
