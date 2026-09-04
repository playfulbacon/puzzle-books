# Hashiwokakero (Bridges)

## What it is

Hashiwokakero, "build bridges", scatters numbered islands across open water and asks you to connect
them. Each number is the count of bridges that island will carry. Bridges are straight, run horizontally
or vertically, never cross, and there can be one or two between any pair of islands. When you finish,
every island is reachable from every other: one archipelago, joined.

It is the most arithmetical of the visual puzzles and also the most tactile, because every deduction is
a line drawn between two things you can see. Nikoli published it in 1990.

## The rules

Connect the islands with straight bridges, one or two between any pair, running horizontally or
vertically without crossing each other or passing over an island. Each island's number is its total
bridge count, and every island must be reachable from every other.

## How to read the grid

A **numbered circle** is an island; the number is how many bridge-ends touch it, counting a double
bridge as two. Two islands are **neighbours** if they lie in the same row or column with only water
between them. Only neighbours can be joined. A bridge occupies the water it crosses, so once drawn it
blocks any bridge that would cross it, and it can turn two islands that were neighbours into strangers.

The two numbers to hold in mind for every island are its **number** and its **neighbour count**. Most
deductions compare them.

## First moves

Scan the grid for these before anything else. They are the openings of nearly every puzzle.

1. An **8** anywhere, a **6** on an edge, or a **4** in a corner: every possible bridge is a double.
2. An island with **only one neighbour**: all its bridges go there.
3. A **7**, a **5** on an edge, or a **3** in a corner: at least one bridge to every neighbour.
4. A **1** next to another **1**, or a **2** next to a **2** with nothing else around: they cannot be
   joined in the way that would cut them off.

Draw those and the numbers begin to fall.

## Strategies

### Tier 1 · Counting on one island

**Full islands.** If an island's number equals twice its neighbour count, every neighbour gets a double
bridge. An 8 with four neighbours, a 6 with three, a 4 with two, a 2 with one. Corners and edges have
fewer neighbours, so a corner 4 and an edge 6 are full.

**Single neighbours.** An island with one neighbour sends everything there. A 1 makes a single bridge; a
2 makes a double.

**Almost-full islands.** If the number is one less than twice the neighbour count, every neighbour gets
at least one bridge, because leaving any neighbour out would leave the island short. A 7 with four
neighbours, a corner 3, an edge 5. Draw one bridge to each and return later for the second.

**Neighbour capacity.** A neighbour can accept no more than its own remaining number. A 1 can take one
bridge, never a double. So a 3 whose neighbours are a 1 and one other island sends one bridge to the 1
and a double to the other. In general, if the maximum each neighbour can take adds up exactly to the
island's number, every neighbour takes its maximum.

**Bridges block.** A drawn bridge removes every candidate bridge that would cross it. After each bridge
you draw, recount the neighbours of the islands on either side of it; a lost neighbour often makes
another island full.

### Tier 2 · Keeping the archipelago whole

**The isolated pair.** Two 1s joined to each other form a closed group of two that nothing else can
reach, so they are never joined (unless they are the only islands). Likewise two 2s cannot be joined by
a double bridge, and a 1 cannot be joined to a 2 that has no other neighbours. The pattern: never draw
a bridge that completes a group of islands whose numbers are all satisfied while other islands remain.

**The only way out.** If a group of islands can reach the rest of the grid through just one candidate
bridge, that bridge exists. Look for clusters near corners and along edges that a drawn bridge has
walled in.

**At-least counting.** For an island with number N, take each neighbour in turn and ask: if every
*other* neighbour gave its maximum (two, or its remaining number if less), how many bridges would still
be missing? That many must come from this neighbour. This generalises the almost-full rule and works
for any island once some bridges are drawn.

**Remaining numbers.** As bridges are drawn, think in remaining counts, not printed ones. A 5 with a
double already drawn is a 3 with one fewer neighbour. Every Tier 1 rule applies again to the remaining
number.

### Tier 3 · Seeing the whole grid

**Walls.** A line of bridges divides the water. Islands on one side must still reach the other, so at
least one bridge must cross the gap where the wall is open. If only one candidate crosses the gap, draw
it.

**Total count.** The sum of all numbers is twice the number of bridge-ends, so it is even; and a
connected archipelago of k islands needs at least k − 1 bridges. On a hard puzzle, counting bridges left
to place against candidates left can settle a region.

**Short chains.** Try a double bridge in one place and follow it: does it cut a group off, or leave an
island unable to reach its number? If so, it is a single. Two or three steps is all a hard puzzle asks;
the book never needs a long chain.

## Things that go wrong

- Drawing a bridge through an island. Bridges stop at the first island they meet.
- Forgetting that a bridge blocks. The neighbour count changes every time you draw.
- Satisfying every number and only then noticing two separate archipelagos. Check connectivity as you
  go; the isolated-pair rule is the early warning.
- Reading a 2 as "two bridges to two islands". It may be a double to one.
- Counting a double bridge as one.
