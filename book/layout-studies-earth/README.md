# Layout studies, earth and ink

Second set of page studies, aimed at a wabi-sabi / zen brief: cream stock, one black ink, restraint,
negative space, brush-drawn Japanese, deliberate imperfection, and one earth-accent variant.
All pages carry real verified puzzles from `review/data/batches`.

- `CreamAndInk.dc.html` — Cream and ink (base page)
- `EnsoOpener.dc.html` — genre section opener with a brushed enso
- `Tategaki.dc.html` — vertical Japanese running head, kanji day number
- `EarthAccent.dc.html` — one clay tone; implies a colour interior (2–3× unit cost, white paper only)
- `HandInked.dc.html` — faint hand-ruled wobble on the grid via an SVG displacement filter
- `Ma.dc.html` — negative space as the composition
- `MaColumn.dc.html` — Ma with day, kanji, dots and a whispered title in the column, no rules
- `MaColumnTitle.dc.html` — day up top in ink; whispered title then 4 px dots in the column

Page two of the canvas, "Ma variants": six layouts that keep the grid alone in its horizontal band
and group name, Japanese name, rules and difficulty into one block.

- `MaHighText.dc.html` — text high at the gutter, grid low
- `MaHighGrid.dc.html` — grid high, text low
- `MaCentered.dc.html` — centred block and grid
- `MaDiagonal.dc.html` — block flush right, smaller grid at the gutter
- `MaBottom.dc.html` — block and grid stacked on the bottom margin
- `MaBrush.dc.html` — kana in the brush face leads the block

Page three, "Day forward": day and difficulty carry the page; the genre name and rules are a whisper
or absent, on the assumption that each genre's enso opener states them once.

- `DayNumeral.dc.html` — large numeral at the gutter, five circles, one-line whisper
- `DayDiagonal.dc.html` — same block flush right, smaller grid at the gutter
- `DayKanji.dc.html` — day in brush-face kanji numerals, title only
- `DayDots.dc.html` — five large circles as the anchor, genre as a label under the grid
- `DayLabelBelow.dc.html` — numeral and dots on one line, caption under the grid
- `DayOnly.dc.html` — day and dots only

Page four, "Label below, refined": day and challenge at whisper weight and colour, set simply.

- `LbLeftStacked.dc.html`, `LbLeftLine.dc.html` — left-aligned, stacked or one line
- `LbRightStacked.dc.html` — right-aligned, caption right-aligned too
- `LbTwoEnds.dc.html` — day at the gutter, challenge at the outer margin
- `LbCrosswise.dc.html` — right-aligned above, caption left below
- `LbAllBelow.dc.html` — nothing above the grid; everything on the line beneath it

Page five, "Ma, small grid": grids of 440, 400 and 360 px so the emptiness reads as space, with the
caption in its own band.

- `SmOriginal.dc.html` — the original Ma, whispered
- `SmGutter.dc.html` — grid at the gutter, words right-aligned
- `SmCentred.dc.html` — 400 px grid centred low
- `SmTextTop.dc.html` — all words in one whisper block at the top-left
- `SmInverted.dc.html` — grid high, words at the bottom-left
- `SmSmallest.dc.html` — 360 px grid, the most empty page

Page six, "Chosen": the refined direction, small grid with words up top. No challenge label, 7 px
dots, day line one step heavier, day repeated in kanji numerals.

- `ChosenSmallGrid.dc.html` — kanji inline after the day
- `ChosenKanjiBelow.dc.html` — kanji on its own line
- `ChosenKanjiBrush.dc.html` — kanji in the brush face
- `ChosenInkDay.dc.html` — the lead with the day in ink and 5 px dots

Page seven, "Hand-inked, refined": full-width 536 px grid with the hand-ruled wobble, day with
kanji and dots up top, whispered caption beneath.

- `HiLeft.dc.html` — left, print-safe wobble
- `HiStrong.dc.html` — left, stronger wobble
- `HiRight.dc.html` — right-aligned
- `HiTwoEnds.dc.html` — day at the gutter, dots at the outer margin
- `HiCross.dc.html` — day left, caption right
- `HiNuri.dc.html` — medium wobble on a heavy-bordered Nurikabe grid
- `HiTwoEndsInk.dc.html` — two ends with the whole upper line in ink and 5 px dots
- `HiTwoEndsInkLow.dc.html` — the same, grid lower and caption tucked close beneath it
- `HiCentred.dc.html` — 440 px grid centred on the page, caption anchored to the bottom margin
- `HiCentredAshDots.dc.html` — the same with the dots in the caption's ash
- `HiTextWidth.dc.html` — grid's visible edges on the text margins, centred vertically
- `HiTextWidthIn.dc.html` — the same with margins brought in to 96 / 88 px

Page eight, "The format, all genres": the chosen page format (margins 96 / 88 px, grid edges on the
text margins, centred vertically, ink day with kanji, ash dots, whispered caption, hand-ruled wobble)
applied to every genre. `Main.dc.html` is the Slitherlink page; `FmtMasyu`, `FmtGokigen`, `FmtHashi`,
`FmtShikaku`, `FmtNurikabe` are the others.

Page nine, "The format, dots above the title": the same format with only the day on the top line
and the dots directly above the caption at the foot. `DlSlitherlink`, `DlMasyu`, `DlGokigen`,
`DlHashi`, `DlShikaku`, `DlNurikabe`.

Page ten, "Puzzle refinements": the drawings themselves, changed in `core/` so the book and the
review site agree. No white fills (paper tone instead), inner grid rules 0.012 of a cell in ash
with only the outer border in ink, thinner dots and pearl strokes, and a digit-font option.
`RfCormorant`, `RfGaramond`, `RfShippori`, `RfKlee`, `RfZenKaku` try five faces on one
Slitherlink; `RfShikakuGaramond`, `RfMasyu`, `RfHashiGaramond` show the lighter grids.
- `build.mjs` regenerates the pages from the batches: `node book/layout-studies-earth/build.mjs <outdir>`

Palette: paper #F3EEE3, ink #1A1917, ash #8E877B, clay #B5643C (accent variant only).
Type: Cormorant Garamond (Latin), Yuji Syuku (brush kana), Shippori Mincho (small Japanese), IBM Plex Sans (grid digits).
Cream paper is a free option for black-and-white interiors on KDP; colour interiors print on white only.
