"""Sudoku generator: solution-first, symmetric clue reduction, uniqueness oracle.

Difficulty rating here is PROVISIONAL: a singles-only human solver decides whether
the puzzle is solvable with naked/hidden singles alone. The full technique ladder
(PLAN.md §3.4) replaces `rate()` later without changing the JSON contract.

Usage:
    python -m puzzlegen.sudoku --count 12 --seed 100 --out review/data/batches/sudoku-sample.json
"""
from __future__ import annotations

import argparse
import json
import random
import time
from dataclasses import dataclass

from . import GENERATOR_VERSION

N = 9
ALL = 0x1FF  # bitmask of digits 1..9

ROWS = [[r * 9 + c for c in range(9)] for r in range(9)]
COLS = [[r * 9 + c for r in range(9)] for c in range(9)]
BOXES = [[(br * 3 + r) * 9 + (bc * 3 + c) for r in range(3) for c in range(3)]
         for br in range(3) for bc in range(3)]
UNITS = ROWS + COLS + BOXES
CELL_UNITS = [[u for u in UNITS if i in u] for i in range(81)]
PEERS = [sorted({j for u in CELL_UNITS[i] for j in u} - {i}) for i in range(81)]


def _bit(d: int) -> int:
    return 1 << (d - 1)


def _digit(mask: int) -> int:
    return mask.bit_length()


# ----------------------------------------------------------------------------- oracle

def candidates(grid: list[int]) -> list[int]:
    """Bitmask of legal digits for every cell (filled cells get their own bit)."""
    cand = [ALL] * 81
    for i, d in enumerate(grid):
        if d:
            cand[i] = _bit(d)
            for p in PEERS[i]:
                if not grid[p]:
                    cand[p] &= ~_bit(d)
    return cand


def count_solutions(grid: list[int], limit: int = 2) -> int:
    """Count solutions up to `limit` with MRV backtracking. This is the uniqueness oracle."""
    grid = grid[:]
    cand = candidates(grid)
    found = 0

    def rec() -> bool:
        nonlocal found
        best, best_n = -1, 10
        for i in range(81):
            if grid[i]:
                continue
            n = bin(cand[i]).count("1")
            if n == 0:
                return False
            if n < best_n:
                best, best_n = i, n
                if n == 1:
                    break
        if best == -1:
            found += 1
            return found >= limit
        m = cand[best]
        while m:
            b = m & -m
            m ^= b
            saved = cand[:]
            grid[best] = _digit(b)
            ok = True
            for p in PEERS[best]:
                if not grid[p]:
                    cand[p] &= ~b
                    if cand[p] == 0:
                        ok = False
                        break
            if ok and rec():
                return True
            grid[best] = 0
            cand[:] = saved
        return False

    rec()
    return found


def random_solution(rng: random.Random) -> list[int]:
    grid = [0] * 81
    cand = [ALL] * 81

    def rec() -> bool:
        best, best_n = -1, 10
        for i in range(81):
            if grid[i]:
                continue
            n = bin(cand[i]).count("1")
            if n == 0:
                return False
            if n < best_n:
                best, best_n = i, n
        if best == -1:
            return True
        digits = [d for d in range(1, 10) if cand[best] & _bit(d)]
        rng.shuffle(digits)
        for d in digits:
            saved = cand[:]
            grid[best] = d
            for p in PEERS[best]:
                if not grid[p]:
                    cand[p] &= ~_bit(d)
            if rec():
                return True
            grid[best] = 0
            cand[:] = saved
        return False

    rec()
    return grid


# ----------------------------------------------------------------------------- provisional human solver

@dataclass
class Trace:
    solved: bool
    steps: list[tuple[str, int]]          # (technique, cell)
    opening_width: int                    # tier-1 deductions available at the start


def singles_solver(grid: list[int]) -> Trace:
    """Apply naked singles then hidden singles until stuck. Tier-1 only."""
    grid = grid[:]
    steps: list[tuple[str, int]] = []
    opening = None
    while True:
        cand = candidates(grid)
        moves: list[tuple[str, int, int]] = []
        for i in range(81):
            if not grid[i] and bin(cand[i]).count("1") == 1:
                moves.append(("naked_single", i, _digit(cand[i])))
        seen = {m[1] for m in moves}
        for u in UNITS:
            for d in range(1, 10):
                b = _bit(d)
                spots = [i for i in u if not grid[i] and cand[i] & b]
                if len(spots) == 1 and spots[0] not in seen and not any(grid[i] == d for i in u):
                    moves.append(("hidden_single", spots[0], d))
                    seen.add(spots[0])
        if opening is None:
            opening = len(moves)
        if not moves:
            break
        # Apply one move at a time so the trace reflects a human's sequence.
        tech, i, d = moves[0]
        grid[i] = d
        steps.append((tech, i))
    return Trace(solved=all(grid), steps=steps, opening_width=opening or 0)


def rate(puzzle: list[int]) -> dict:
    """Provisional rating. Replace with the technique-ladder solver in Milestone 1."""
    t = singles_solver(puzzle)
    clues = sum(1 for d in puzzle if d)
    hidden = sum(1 for s in t.steps if s[0] == "hidden_single")
    if t.solved and hidden <= 8:
        band, label = 1, "Gentle"
    elif t.solved:
        band, label = 2, "Easy"
    else:
        band, label = 3, "Medium+"   # needs something beyond singles; not yet measured
    return {
        "band": band,
        "label": label,
        "score": round((3 - (1 if t.solved else 0)) * 10 + hidden * 0.5 + (81 - clues) * 0.2, 1),
        "max_tier": 1 if t.solved else None,
        "rating_method": "provisional-singles-only",
        "technique_counts": {
            "naked_single": sum(1 for s in t.steps if s[0] == "naked_single"),
            "hidden_single": hidden,
        },
        "path": {"opening_width": t.opening_width, "singles_resolved": len(t.steps)},
    }


# ----------------------------------------------------------------------------- generation

def reduce_symmetric(solution: list[int], rng: random.Random, target_clues: int) -> list[int]:
    """Remove givens in 180°-rotational pairs while the puzzle stays unique."""
    puzzle = solution[:]
    orbits = [(i, 80 - i) for i in range(40)] + [(40,)]
    rng.shuffle(orbits)
    for orbit in orbits:
        if sum(1 for d in puzzle if d) <= target_clues:
            break
        saved = [puzzle[i] for i in orbit]
        for i in orbit:
            puzzle[i] = 0
        if count_solutions(puzzle, 2) != 1:
            for i, d in zip(orbit, saved):
                puzzle[i] = d
    return puzzle


def generate(seed: int, target_band: int | None = None, max_attempts: int = 40) -> dict:
    rng = random.Random(seed)
    target_clues = {1: 36, 2: 30, 3: 24}.get(target_band or 0, 26)
    for attempt in range(max_attempts):
        solution = random_solution(rng)
        puzzle = reduce_symmetric(solution, rng, target_clues)
        rating = rate(puzzle)
        if target_band is None or rating["band"] == target_band:
            break
    to_str = lambda g: "".join(str(d) if d else "." for d in g)
    return {
        "id": f"sudoku-9x9-s{seed:06d}-v{GENERATOR_VERSION}",
        "type": "sudoku",
        "generator_version": GENERATOR_VERSION,
        "seed": seed,
        "params": {"rows": 9, "cols": 9, "box_rows": 3, "box_cols": 3,
                   "symmetry": "rotational-180", "target_band": target_band},
        "difficulty": rating,
        "clues": {"grid": to_str(puzzle)},
        "solution": {"grid": to_str(solution)},
        "stats": {"clue_count": sum(1 for d in puzzle if d), "attempts": attempt + 1},
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--count", type=int, default=12)
    ap.add_argument("--seed", type=int, default=1, help="first seed; puzzle k uses seed+k")
    ap.add_argument("--band", type=int, default=None, help="target band 1-3 (provisional rater)")
    ap.add_argument("--batch", default=None, help="batch name (default derived from args)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    t0 = time.time()
    puzzles = [generate(a.seed + k, a.band) for k in range(a.count)]
    batch = {
        "batch": a.batch or f"sudoku-s{a.seed}-n{a.count}" + (f"-b{a.band}" if a.band else ""),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "generator_version": GENERATOR_VERSION,
        "puzzles": puzzles,
    }
    with open(a.out, "w") as f:
        json.dump(batch, f, indent=1)
    bands = [p["difficulty"]["band"] for p in puzzles]
    print(f"wrote {len(puzzles)} puzzles to {a.out} in {time.time()-t0:.1f}s; bands={bands}")


if __name__ == "__main__":
    main()
