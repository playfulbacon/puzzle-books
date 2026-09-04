# Masyu

## What it is

Masyu is a loop puzzle told entirely with two kinds of pearl. There are no numbers. A single closed
loop threads through the grid, and every pearl it passes tells you something about how it moved there:
white pearls are passed straight through, black pearls are turned at. Nothing else is given. The pleasure
is in watching a path that seems to have too little information become the only path possible.

Nikoli published the first Masyu in 2000. The name means "evil influence", a pun the setters made on
the earlier title *Shinju no kubikazari*, "pearl necklace".

## The rules

Draw one loop through the centres of cells. Pass straight through white pearls and turn in the cell
just before or just after. Turn at black pearls and go straight through both neighbouring cells. The
loop never crosses or branches, and it need not visit every cell.

## How to read the grid

A **white pearl** is a cell the loop runs straight through, and at least one of the two cells on either
side of it is a corner of the loop. A **black pearl** is a corner of the loop, and the loop travels at
least two cells in a straight line away from it on both sides. Empty cells carry no information at all,
and the finished loop may leave any number of them untouched. The loop is a single closed ring: every
cell it uses has exactly two segments leaving it.

It helps to mark what you know is *not* there. A small cross across a cell edge means "the loop does not
pass here". Half of Masyu is placing crosses.

## First moves

Look for these, in this order. Most puzzles open with two or three of them.

1. A black pearl in a corner or on an edge.
2. A black pearl one cell in from an edge.
3. A white pearl on an edge.
4. Three or more white pearls in a row.
5. Two black pearls side by side.

Each of these fixes segments with no further thought. Once they are drawn, the loop rules take over.

## Strategies

### Tier 1 · What one pearl tells you

**Black on the edge.** A black pearl needs two straight cells in each direction it leaves. On an edge,
one of the two axes has a side with no room at all, so the loop leaves the pearl *away* from the edge
and continues one more cell. In a corner both legs are fixed: they run along the two edges, two cells
each.

**Black one cell from an edge.** The leg pointing toward the near edge would have to run two cells and
there is only one. So that leg points the other way, inward, for two cells.

**White on the edge.** The loop cannot enter a border cell from outside the grid, so a white pearl on an
edge is passed straight through *along* the edge. It still needs a turn at one of its two neighbours,
which usually comes for free from the corner of the grid or a nearby pearl.

**Three whites in a line.** If the loop ran along the line through all three, the middle pearl would have
a straight-through neighbour on each side and nowhere to turn. So the loop crosses the line: it passes
through each of the three pearls perpendicular to the row. (Two whites in a row are not enough; the loop
may run along them if it turns immediately beyond each end.)

**Two blacks side by side.** Each needs two straight cells beyond itself on the shared axis. Pointing at
each other, the first's leg would run through the second, which must turn. So their legs on that axis
point away from each other.

### Tier 2 · What the loop tells you

**Two in, two out.** Every cell on the loop has exactly two segments. When two are drawn, cross out the
other two edges. When one is drawn and only one other edge remains open, it must be used. This single
rule carries the middle of almost every puzzle.

**Dead ends.** A cell with fewer than two open edges cannot be on the loop at all; cross its remaining
edge. Dead ends propagate: crossing one edge can strand the next cell. Empty corners and cells boxed in
by crosses fall this way.

**Reach of a black pearl.** A black pearl's legs are two cells long. If a cross, a border, or another
pearl's forced turn sits within two cells in some direction, that direction is out, and the pearl's leg
on that axis goes the other way.

**The white pearl's turn.** Once a white pearl's line is known and one neighbour is known to continue
straight, the other neighbour must turn: cross the edge beyond it. This is the most frequently missed
deduction in the game.

**A white next to a black on the same line.** If a black pearl's leg runs into an adjacent white pearl,
it passes straight through the white and one cell further. The white's line is thereby fixed, and its
required turn is already supplied by the black.

**Whites in the second row.** A white pearl one cell from an edge, with its line running toward the
edge, sends the loop into the border cell, which must then turn along the border. That is legal, and it
often decides which way the border run goes.

### Tier 3 · What the whole loop tells you

**No early closing.** A path that would join its two ends into a closed ring while any pearl is still
unvisited is not the loop; cross the closing edge. Watch for this whenever two path ends approach each
other.

**Ends must meet.** The loop is one ring, so the two open ends of any long path will eventually join. If
one end has a single possible route toward the other, take it. If a region of the grid can only be
entered through one opening, and a pearl lies inside, the loop goes in and comes out through that
opening.

**Counting a corridor.** A narrow band of cells between two crossed-off regions is a corridor. The loop
either uses it end to end or not at all. If a pearl sits in the corridor, it is used.

**Short chains.** Hard puzzles ask you to try one of two options for a segment and follow it three or
four steps until it breaks a pearl or strands a region. This is still deduction, not guessing, as long as
the chain is short and you undo it. The book's hardest puzzles need one or two of these; the gentle ones
need none.

## Things that go wrong

- Treating a white pearl as if the turn were *at* it. The turn is next door.
- Forgetting the black pearl's second cell. One straight cell is not enough.
- Drawing the loop through every empty cell. It need not, and usually does not.
- Closing the loop early. If any pearl is untouched when the ring closes, something upstream is wrong.
- Not placing crosses. Every cross is information; the loop is found as much by where it cannot go as
  by where it must.
