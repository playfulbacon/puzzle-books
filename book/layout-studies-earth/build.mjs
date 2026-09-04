// Page studies: wabi-sabi / zen minimalism, cream stock, black ink, one earth accent variant.
// Pages carry real puzzles from review/data/batches. Run: node book/layout-studies-earth/build.mjs <outdir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GENRES } from "../../core/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = process.argv[2] || join(ROOT, "build", "layout-studies-earth");
mkdirSync(OUT, { recursive: true });
const batch = (name) => JSON.parse(readFileSync(join(ROOT, "review/data/batches", name), "utf8")).puzzles;
const P = {
  masyu: batch("masyu-10x10-b3.json")[0],
  gokigen: batch("gokigen-10x10-b3.json")[1],
  hashi: batch("hashi-10x10.json")[2],
  slither: batch("slitherlink-10x10-b3.json")[3],
  shikaku: batch("shikaku-10x10.json")[4],
  nurikabe: batch("nurikabe-8x8.json")[1],
};
// core SVG with the white ground removed so the paper shows through, and ink retinted
const INK = "#1A1917";
const art = (p, cell, extra = {}) => GENRES[p.type].render.svg(p, { cell, ...extra })
  .replace(/<rect width="[^"]+" height="[^"]+" fill="#fff"\/>/, "")
  .replace(/#1c1b18/g, INK)
  .replace(/<svg /, '<svg width="100%" height="100%" ');

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&amp;family=Yuji+Syuku&amp;family=Shippori+Mincho:wght@400;500&amp;family=IBM+Plex+Sans:wght@400;500&amp;display=swap">`;
const CSS = `
  body { margin: 0; background: #F3EEE3; color: ${INK}; }
  a { color: ${INK}; } a:hover { color: #8E877B; }
  .page { width: 672px; height: 960px; position: relative; box-sizing: border-box; background: #F3EEE3; font-family: 'Cormorant Garamond', 'Cormorant', Garamond, Georgia, serif; overflow: hidden; }
  .page.white { background: #FFFFFF; }
  .brush { font-family: 'Yuji Syuku', 'Shippori Mincho', 'Hiragino Mincho ProN', serif; }
  .jp { font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif; }
  .small { font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: #8E877B; font-weight: 500; }
  .rules { font-size: 17px; line-height: 1.5; font-weight: 400; color: #4A463F; text-wrap: pretty; }
  .folio { font-size: 12px; color: #8E877B; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
  .dots { letter-spacing: 0.3em; font-size: 10px; color: ${INK}; }
`;
const wrap = (body, extraCss = "") => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONTS}
  <style>${CSS}${extraCss}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;
const dots = (n) => "●".repeat(n) + "○".repeat(5 - n);
const KANJI = { 14: "十四", 22: "二十二", 31: "三十一", 47: "四十七", 58: "五十八", 63: "六十三" };

// Brushed enso: a ring whose stroke breathes, with an opening, roughened by a turbulence filter.
function enso(cx, cy, r, seed = 3) {
  const N = 140, outer = [], inner = [];
  let s = seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const jitter = Array.from({ length: N + 1 }, () => (rnd() - 0.5) * 1.6);
  for (let k = 0; k <= N; k++) {
    const t = k / N, a = -Math.PI * 0.62 + t * Math.PI * 1.86; // leaves a gap at upper left
    const w = 3 + 16 * Math.pow(Math.sin(Math.PI * t), 0.7) * (0.75 + 0.25 * Math.cos(t * 9)) + jitter[k];
    outer.push([cx + (r + w / 2) * Math.cos(a), cy + (r + w / 2) * Math.sin(a)]);
    inner.push([cx + (r - w / 2) * Math.cos(a), cy + (r - w / 2) * Math.sin(a)]);
  }
  const pts = [...outer, ...inner.reverse()].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return `<svg width="100%" height="100%" viewBox="0 0 ${cx * 2} ${cy * 2}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter></defs>
    <polygon points="${pts}" fill="${INK}" opacity="0.92" filter="url(#rough)"/>
  </svg>`;
}

// ---------- 1. Cream and ink (Main): everything small and low; the grid sits in the lower two thirds; nothing else competes.
const creamAndInk = wrap(`
<div class="page" style="padding: 88px 64px 64px 72px; display: flex; flex-direction: column;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span class="small">Day 22</span>
    <span class="dots">${dots(3)}</span>
  </div>
  <div style="display: flex; align-items: baseline; gap: 14px; margin-top: 10px;">
    <span style="font-size: 30px; font-weight: 300; letter-spacing: 0.02em;">Masyu</span>
    <span class="brush" style="font-size: 22px; color: #4A463F;">ましゅ</span>
  </div>
  <div style="flex: 1;"></div>
  <div style="width: 536px; height: 536px; align-self: center;">${art(P.masyu, 50)}</div>
  <div style="flex: 0.55;"></div>
  <p class="rules" style="margin: 0; max-width: 480px;">One loop through the centres of cells. Pass straight through white pearls and turn just before or after. Turn at black pearls and run straight through both neighbours.</p>
  <div class="folio" style="position: absolute; bottom: 34px; left: 0; right: 0; text-align: center;">30</div>
</div>`);

// ---------- 2. Enso opener: a section title page for a genre. One brush mark, brushed kana, a whisper of Latin.
const ensoOpener = wrap(`
<div class="page" style="padding: 0;">
  <div style="position: absolute; left: 96px; top: 168px; width: 480px; height: 480px;">${enso(240, 240, 176, 7)}</div>
  <div class="brush" style="position: absolute; left: 0; right: 0; top: 356px; text-align: center; font-size: 96px; line-height: 1; color: ${INK};">ましゅ</div>
  <div style="position: absolute; left: 0; right: 0; top: 700px; display: flex; flex-direction: column; align-items: center; gap: 14px;">
    <span style="font-size: 26px; font-weight: 300; letter-spacing: 0.24em; text-transform: uppercase;">Masyu</span>
    <span class="small" style="letter-spacing: 0.22em;">Pearls · twelve puzzles</span>
  </div>
  <p class="rules" style="position: absolute; left: 136px; right: 136px; bottom: 96px; margin: 0; text-align: center; font-style: italic; font-size: 16px; color: #8E877B;">Draw one loop. Straight through the white, turning beside it. Turn at the black, straight beyond it.</p>
</div>`);

// ---------- 3. Tategaki: vertical Japanese running head down the outer edge, day number in kanji.
const tategaki = wrap(`
<div class="page" style="padding: 0;">
  <div class="jp" style="position: absolute; right: 52px; top: 84px; writing-mode: vertical-rl; text-orientation: mixed; font-size: 20px; letter-spacing: 0.32em; color: ${INK};">ごきげんななめ　<span style="font-size: 15px; color: #8E877B;">四十七</span></div>
  <div style="position: absolute; left: 72px; top: 84px; display: flex; flex-direction: column; gap: 6px;">
    <span class="small">Day 47</span>
    <span style="font-size: 30px; font-weight: 300;">Gokigen Naname</span>
    <span class="dots" style="margin-top: 4px;">${dots(3)}</span>
  </div>
  <div style="position: absolute; left: 72px; top: 236px; width: 528px; height: 528px;">${art(P.gokigen, 48)}</div>
  <p class="rules" style="position: absolute; left: 72px; width: 420px; bottom: 96px; margin: 0;">One diagonal in every cell. A number at a crossing counts the diagonals that touch it. No loop may close.</p>
  <div class="folio" style="position: absolute; bottom: 34px; left: 72px;">55</div>
</div>`);

// ---------- 4. Earth accent (colour interior): the same restraint, plus one clay tone on the day mark and the pearls of difficulty.
const CLAY = "#B5643C";
const earthAccent = wrap(`
<div class="page" style="padding: 88px 64px 64px 72px; display: flex; flex-direction: column;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span class="small" style="color: ${CLAY};">Day 31</span>
    <span class="dots" style="color: ${CLAY};">${dots(2)}</span>
  </div>
  <div style="display: flex; align-items: baseline; gap: 14px; margin-top: 10px;">
    <span style="font-size: 30px; font-weight: 300; letter-spacing: 0.02em;">Hashiwokakero</span>
    <span class="brush" style="font-size: 22px; color: #4A463F;">橋をかけろ</span>
  </div>
  <div style="flex: 1;"></div>
  <div style="width: 536px; height: 536px; align-self: center;">${art(P.hashi, 50)}</div>
  <div style="flex: 0.55;"></div>
  <p class="rules" style="margin: 0; max-width: 480px;">Join the islands with straight bridges, one or two between a pair, never crossing. Each number is an island's bridge count, and every island must be reachable from every other.</p>
  <div style="position: absolute; bottom: 34px; left: 72px; right: 64px; display: flex; justify-content: space-between; align-items: center;">
    <span style="width: 28px; height: 1px; background: ${CLAY};"></span>
    <span class="folio">39</span>
    <span style="width: 28px; height: 1px; background: ${CLAY};"></span>
  </div>
</div>`);

// ---------- 5. Hand-inked: the grid itself carries imperfection — a slight ink wobble on lines and numbers, as if ruled by hand.
const handInked = wrap(`
<div class="page" style="padding: 88px 64px 64px 72px; display: flex; flex-direction: column;">
  <div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span class="small">Day 58</span>
    <span class="dots">${dots(2)}</span>
  </div>
  <div style="display: flex; align-items: baseline; gap: 14px; margin-top: 10px;">
    <span style="font-size: 30px; font-weight: 300;">Shikaku</span>
    <span class="brush" style="font-size: 22px; color: #4A463F;">四角に切れ</span>
  </div>
  <div style="flex: 1;"></div>
  <div style="width: 536px; height: 536px; align-self: center;">
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; width:0; height:0;"><defs><filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter></defs></svg>
    <div style="width: 100%; height: 100%; filter: url(#ink);">${art(P.shikaku, 50)}</div>
  </div>
  <div style="flex: 0.55;"></div>
  <p class="rules" style="margin: 0; max-width: 480px;">Cut the grid into rectangles. Each holds exactly one number, and that number is its area.</p>
  <div class="folio" style="position: absolute; bottom: 34px; left: 0; right: 0; text-align: center;">66</div>
</div>`);

// ---------- 6. Ma: emptiness as the composition. A smaller grid low and to the outer edge; the top half of the page is silence.
const ma = wrap(`
<div class="page" style="padding: 0;">
  <div style="position: absolute; left: 72px; top: 96px; display: flex; flex-direction: column; gap: 8px;">
    <span class="small">Day 63</span>
    <span class="jp" style="font-size: 15px; color: #8E877B;">六十三</span>
  </div>
  <div style="position: absolute; right: 64px; top: 96px;" class="dots">${dots(3)}</div>
  <div style="position: absolute; right: 64px; top: 428px; width: 440px; height: 440px;">${art(P.slither, 40)}</div>
  <div style="position: absolute; left: 72px; top: 428px; width: 100px; display: flex; flex-direction: column; gap: 10px;">
    <span style="font-size: 22px; font-weight: 300; line-height: 1.1;">Slither<br>link</span>
    <span class="brush" style="font-size: 13px; color: #4A463F; white-space: nowrap; letter-spacing: -0.02em;">スリザーリンク</span>
  </div>
  <p class="rules" style="position: absolute; left: 72px; width: 96px; top: 548px; margin: 0; font-size: 13px; line-height: 1.5; color: #8E877B;">One loop along the dotted lines. A number is how many of its four sides the loop uses.</p>
  <div class="folio" style="position: absolute; bottom: 34px; right: 64px;">71</div>
</div>`);


// =====================================================================================
// Ma variants. In every one the grid owns its full horizontal band; name, Japanese name,
// rules and difficulty are one block. Only the positions and the grid size change.
const RULES = {
  masyu: "One loop through the centres of cells. Straight through white pearls, turning just before or after. Turn at black pearls, straight through both neighbours.",
  gokigen: "One diagonal in every cell. A number at a crossing counts the diagonals that touch it. No loop may close.",
  slitherlink: "One loop along the dotted lines. A number is how many of its four sides the loop uses.",
  hashi: "Straight bridges between islands, one or two per pair, never crossing. Each number is an island's bridge count, and every island is reachable from every other.",
  shikaku: "Cut the grid into rectangles. Each holds exactly one number, and that number is its area.",
  nurikabe: "Shade a single connected sea with no 2×2 block. Each number is an island of that many cells; islands touch only at corners.",
};
const NAMES = { masyu: ["Masyu", "ましゅ"], gokigen: ["Gokigen Naname", "ごきげんななめ"], slitherlink: ["Slitherlink", "スリザーリンク"], hashi: ["Hashiwokakero", "橋をかけろ"], shikaku: ["Shikaku", "四角に切れ"], nurikabe: ["Nurikabe", "ぬりかべ"] };
// The block: day, name + kana, rules, dots. `align` = left | right | center.
const block = (p, day, band, { align = "left", width = 400, size = "regular", brushName = false } = {}) => {
  const [name, kana] = NAMES[p.type];
  const ta = align === "center" ? "center" : align === "right" ? "right" : "left";
  const items = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const nameRow = brushName
    ? `<div style="display: flex; flex-direction: column; align-items: ${items}; gap: 6px;"><span class="brush" style="font-size: 54px; line-height: 1; color: ${INK};">${kana}</span><span style="font-size: 15px; letter-spacing: 0.26em; text-transform: uppercase; font-weight: 500;">${name}</span></div>`
    : `<div style="display: flex; align-items: baseline; gap: 12px; justify-content: ${items};"><span style="font-size: ${size === "small" ? 24 : 30}px; font-weight: 300; line-height: 1.1;">${name}</span><span class="brush" style="font-size: ${size === "small" ? 15 : 19}px; color: #4A463F;">${kana}</span></div>`;
  return `<div style="display: flex; flex-direction: column; align-items: ${items}; gap: 14px; width: ${width}px; text-align: ${ta};">
    <span class="small">Day ${day}</span>
    ${nameRow}
    <p class="rules" style="margin: 0; font-size: ${size === "small" ? 14 : 16}px; color: #6B665C;">${RULES[p.type]}</p>
    <span class="dots">${dots(band)}</span>
  </div>`;
};
const grid = (p, cell, style) => `<div style="${style}">${art(p, cell)}</div>`;
const folio = (n, where) => `<div class="folio" style="position: absolute; bottom: 34px; ${where}">${n}</div>`;

// 1. Text high at the gutter, grid low and full width. The gap between them is the page.
const maHighText = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 96px;">${block(P.masyu, 63, 3)}</div>
  ${grid(P.masyu, 50, "position: absolute; left: 68px; top: 372px; width: 536px; height: 536px;")}
  ${folio(71, "right: 64px;")}
</div>`);

// 2. Inverted: grid high, text low at the gutter. The eye lands on the puzzle first; the words wait.
const maHighGrid = wrap(`<div class="page">
  ${grid(P.gokigen, 50, "position: absolute; left: 68px; top: 84px; width: 536px; height: 536px;")}
  <div style="position: absolute; left: 72px; bottom: 96px;">${block(P.gokigen, 47, 3)}</div>
  ${folio(55, "right: 64px;")}
</div>`);

// 3. Centred: a small centred block high on the page like a haiku, the grid centred below.
const maCentered = wrap(`<div class="page">
  <div style="position: absolute; left: 0; right: 0; top: 108px; display: flex; justify-content: center;">${block(P.slither, 22, 2, { align: "center", width: 380, size: "small" })}</div>
  ${grid(P.slither, 46, "position: absolute; left: 90px; top: 396px; width: 492px; height: 492px;")}
  ${folio(30, "left: 0; right: 0; text-align: center;")}
</div>`);

// 4. Diagonal: text set flush right at the outer margin, a smaller grid low at the gutter.
const maDiagonal = wrap(`<div class="page">
  <div style="position: absolute; right: 64px; top: 96px;">${block(P.hashi, 31, 2, { align: "right", width: 340, size: "small" })}</div>
  ${grid(P.hashi, 44, "position: absolute; left: 68px; top: 452px; width: 440px; height: 440px;")}
  ${folio(39, "right: 64px;")}
</div>`);

// 5. Bottom-anchored: block directly above the grid, both sitting on the bottom margin; the top half is silence.
const maBottom = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; bottom: 612px;">${block(P.shikaku, 58, 2, { width: 460 })}</div>
  ${grid(P.shikaku, 50, "position: absolute; left: 68px; bottom: 60px; width: 536px; height: 536px;")}
  ${folio(66, "right: 64px;")}
</div>`);

// 6. Brush name: the kana set large in the brush face leads the block; a smaller grid, low and centred.
const maBrush = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 96px;">${block(P.nurikabe, 14, 3, { width: 420, brushName: true })}</div>
  ${grid(P.nurikabe, 55, "position: absolute; left: 116px; top: 424px; width: 440px; height: 440px;")}
  ${folio(22, "left: 0; right: 0; text-align: center;")}
</div>`);

writeFileSync(join(OUT, "MaHighText.dc.html"), maHighText);
writeFileSync(join(OUT, "MaHighGrid.dc.html"), maHighGrid);
writeFileSync(join(OUT, "MaCentered.dc.html"), maCentered);
writeFileSync(join(OUT, "MaDiagonal.dc.html"), maDiagonal);
writeFileSync(join(OUT, "MaBottom.dc.html"), maBottom);
writeFileSync(join(OUT, "MaBrush.dc.html"), maBrush);


// =====================================================================================
// Day forward. Day and difficulty carry the page; title and rules whisper or vanish.
const bigDots = (n, size = 13, gap = 10) => `<div style="display: flex; gap: ${gap}px;">${Array.from({ length: 5 }, (_, i) => `<span style="width: ${size}px; height: ${size}px; border-radius: 50%; border: 1.5px solid ${INK}; background: ${i < n ? INK : "transparent"}; display: inline-block;"></span>`).join("")}</div>`;
const whisper = (p, { withRules = true, size = 11, color = "#9A948A", width = 420, align = "left" } = {}) => {
  const [name, kana] = NAMES[p.type];
  return `<div style="display: flex; flex-direction: column; gap: 6px; width: ${width}px; text-align: ${align}; color: ${color};">
    <span style="font-size: ${size}px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">${name} <span class="jp" style="letter-spacing: 0.1em; text-transform: none; font-weight: 400;">${kana}</span></span>
    ${withRules ? `<span style="font-size: ${size + 1}px; line-height: 1.5; font-style: italic;">${RULES[p.type]}</span>` : ""}
  </div>`;
};
const KANJI_DAY = { 14: "十四", 22: "二十二", 31: "三十一", 47: "四十七", 58: "五十八", 63: "六十三" };

// 1. Numeral. A large light numeral at the gutter, dots beneath, the genre a one-line whisper. Grid low, full width.
const dayNumeral = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 72px; display: flex; flex-direction: column; gap: 18px; align-items: flex-start;">
    <span class="small" style="margin-left: 6px;">Day</span>
    <span style="font-size: 132px; font-weight: 300; line-height: 0.82; letter-spacing: -0.03em; margin-top: -8px;">63</span>
    <div style="margin-left: 6px; margin-top: 6px;">${bigDots(3)}</div>
    <div style="margin-left: 6px; margin-top: 10px;">${whisper(P.masyu)}</div>
  </div>
  ${grid(P.masyu, 50, "position: absolute; left: 68px; top: 384px; width: 536px; height: 536px;")}
  ${folio(71, "right: 64px;")}
</div>`);

// 2. Diagonal numeral. The same block set flush right; a smaller grid at the gutter.
const dayDiagonal = wrap(`<div class="page">
  <div style="position: absolute; right: 64px; top: 72px; display: flex; flex-direction: column; gap: 18px; align-items: flex-end;">
    <span class="small">Day</span>
    <span style="font-size: 132px; font-weight: 300; line-height: 0.82; letter-spacing: -0.03em; margin-top: -8px;">31</span>
    <div style="margin-top: 6px;">${bigDots(2)}</div>
    <div style="margin-top: 10px;">${whisper(P.hashi, { width: 340, align: "right" })}</div>
  </div>
  ${grid(P.hashi, 44, "position: absolute; left: 68px; top: 452px; width: 440px; height: 440px;")}
  ${folio(39, "right: 64px;")}
</div>`);

// 3. Kanji day. The day in kanji numerals in the brush face, Arabic small beside, dots below. Title only, no rules.
const dayKanji = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 84px; display: flex; flex-direction: column; gap: 20px; align-items: flex-start;">
    <div style="display: flex; align-items: baseline; gap: 18px;">
      <span class="brush" style="font-size: 84px; line-height: 1; color: ${INK};">${KANJI_DAY[47]}</span>
      <span class="small" style="font-size: 14px;">Day 47</span>
    </div>
    ${bigDots(3)}
    <div style="margin-top: 6px;">${whisper(P.gokigen, { withRules: false })}</div>
  </div>
  ${grid(P.gokigen, 50, "position: absolute; left: 68px; top: 372px; width: 536px; height: 536px;")}
  ${folio(55, "right: 64px;")}
</div>`);

// 4. Dots as the mark. Difficulty is the anchor: five large circles under a small "Day 22". Title as a museum label under the grid.
const dayDots = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 96px; display: flex; flex-direction: column; gap: 22px; align-items: flex-start;">
    <span style="font-size: 26px; font-weight: 300; letter-spacing: 0.06em;">Day 22</span>
    ${bigDots(2, 22, 14)}
  </div>
  ${grid(P.slither, 50, "position: absolute; left: 68px; top: 300px; width: 536px; height: 536px;")}
  <div style="position: absolute; left: 72px; top: 856px;">${whisper(P.slither, { withRules: false, size: 10 })}</div>
  ${folio(30, "right: 64px;")}
</div>`);

// 5. Label below. Big numeral and dots high; the genre and one rule line sit under the grid like a caption, smaller and greyer than anything else.
const dayLabelBelow = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 72px; display: flex; flex-direction: row; align-items: flex-end; gap: 22px;">
    <span style="font-size: 132px; font-weight: 300; line-height: 0.82; letter-spacing: -0.03em;">58</span>
    <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px;"><span class="small">Day</span>${bigDots(2)}</div>
  </div>
  ${grid(P.shikaku, 50, "position: absolute; left: 68px; top: 300px; width: 536px; height: 536px;")}
  <div style="position: absolute; left: 72px; top: 860px;">${whisper(P.shikaku, { size: 10, width: 460 })}</div>
  ${folio(66, "right: 64px;")}
</div>`);

// 6. Day only. Diagonal geometry, and nothing but the day and dots at the outer margin. The grid is the only thing that says what it is.
const dayOnly = wrap(`<div class="page">
  <div style="position: absolute; right: 64px; top: 72px; display: flex; flex-direction: column; gap: 18px; align-items: flex-end;">
    <span class="small">Day</span>
    <span style="font-size: 132px; font-weight: 300; line-height: 0.82; letter-spacing: -0.03em; margin-top: -8px;">14</span>
    <div style="margin-top: 6px;">${bigDots(3)}</div>
  </div>
  ${grid(P.nurikabe, 55, "position: absolute; left: 68px; top: 452px; width: 440px; height: 440px;")}
  ${folio(22, "right: 64px;")}
</div>`);

writeFileSync(join(OUT, "DayNumeral.dc.html"), dayNumeral);
writeFileSync(join(OUT, "DayDiagonal.dc.html"), dayDiagonal);
writeFileSync(join(OUT, "DayKanji.dc.html"), dayKanji);
writeFileSync(join(OUT, "DayDots.dc.html"), dayDots);
writeFileSync(join(OUT, "DayLabelBelow.dc.html"), dayLabelBelow);
writeFileSync(join(OUT, "DayOnly.dc.html"), dayOnly);


// =====================================================================================
// Label below, refined. Day and challenge at whisper weight and colour, set simply on a line.
const ASH = "#9A948A";
const quietDots = (n, size = 9, gap = 7) => `<span style="display: inline-flex; gap: ${gap}px; align-items: center;">${Array.from({ length: 5 }, (_, i) => `<span style="width: ${size}px; height: ${size}px; border-radius: 50%; border: 1.2px solid ${ASH}; background: ${i < n ? ASH : "transparent"}; display: inline-block;"></span>`).join("")}</span>`;
const meta = (text) => `<span style="font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 500; color: ${ASH};">${text}</span>`;
const dayLine = (day) => meta(`Day ${day}`);
const challengeLine = (band) => `<span style="display: inline-flex; align-items: center; gap: 12px;">${meta("Challenge")}${quietDots(band)}</span>`;
const GRID_TOP = 300;
const gridBand = (p) => grid(p, 50, `position: absolute; left: 68px; top: ${GRID_TOP}px; width: 536px; height: 536px;`);
const caption = (p, side = "left") => `<div style="position: absolute; ${side}: ${side === "left" ? 72 : 64}px; top: 862px;">${whisper(p, { size: 10, width: side === "left" ? 460 : 536, align: side })}</div>`;

// 1. Left, stacked. Day above challenge at the gutter; caption below left.
const lbLeftStacked = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 96px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">${dayLine(58)}${challengeLine(2)}</div>
  ${gridBand(P.shikaku)}${caption(P.shikaku)}${folio(66, "right: 64px;")}
</div>`);

// 2. Left, one line. Day and challenge on a single line, separated by a wide space.
const lbLeftLine = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; top: 96px; display: flex; gap: 36px; align-items: center;">${dayLine(63)}${challengeLine(3)}</div>
  ${gridBand(P.masyu)}${caption(P.masyu)}${folio(71, "right: 64px;")}
</div>`);

// 3. Right, stacked. Everything at the outer margin, caption right-aligned too.
const lbRightStacked = wrap(`<div class="page">
  <div style="position: absolute; right: 64px; top: 96px; display: flex; flex-direction: column; gap: 14px; align-items: flex-end;">${dayLine(47)}${challengeLine(3)}</div>
  ${gridBand(P.gokigen)}${caption(P.gokigen, "right")}${folio(55, "left: 72px;")}
</div>`);

// 4. Two ends. Day at the gutter, challenge at the outer margin, one line; caption below left.
const lbTwoEnds = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; right: 64px; top: 96px; display: flex; justify-content: space-between; align-items: center;">${dayLine(22)}${challengeLine(2)}</div>
  ${gridBand(P.slither)}${caption(P.slither)}${folio(30, "right: 64px;")}
</div>`);

// 5. Crosswise. Day and challenge right-aligned up top, caption left below.
const lbCrosswise = wrap(`<div class="page">
  <div style="position: absolute; right: 64px; top: 96px; display: flex; gap: 36px; align-items: center;">${dayLine(31)}${challengeLine(2)}</div>
  ${gridBand(P.hashi)}${caption(P.hashi)}${folio(39, "right: 64px;")}
</div>`);

// 6. All below. Nothing above the grid; caption left and day/challenge right share the line under it.
const lbAllBelow = wrap(`<div class="page">
  ${gridBand(P.nurikabe.type ? { ...P.nurikabe } : P.nurikabe)}
  <div style="position: absolute; left: 72px; top: 852px;">${whisper(P.nurikabe, { size: 10, width: 330 })}</div>
  <div style="position: absolute; right: 64px; top: 852px; display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">${dayLine(14)}${challengeLine(3)}</div>
  <div class="folio" style="position: absolute; bottom: 16px; left: 0; right: 0; text-align: center;">22</div>
</div>`);

writeFileSync(join(OUT, "LbLeftStacked.dc.html"), lbLeftStacked);
writeFileSync(join(OUT, "LbLeftLine.dc.html"), lbLeftLine);
writeFileSync(join(OUT, "LbRightStacked.dc.html"), lbRightStacked);
writeFileSync(join(OUT, "LbTwoEnds.dc.html"), lbTwoEnds);
writeFileSync(join(OUT, "LbCrosswise.dc.html"), lbCrosswise);
writeFileSync(join(OUT, "LbAllBelow.dc.html"), lbAllBelow);


// =====================================================================================
// Ma, small grid. The grid stays well short of the page width so the emptiness reads as space,
// not margin. Day and challenge at whisper weight; the caption lives in its own band.
const smallGrid = (p, cell, left, top) => { const w = p.params.cols * cell + (p.type === "slitherlink" || p.type === "hashi" || p.type === "gokigen" ? cell : cell * 0.3); return grid(p, cell, `position: absolute; left: ${left}px; top: ${top}px; width: ${w}px; height: ${w}px;`); };
const RIGHT = 64, LEFT = 72, PAGE_W = 672;
const gw = (p, cell) => p.params.cols * cell + (p.type === "slitherlink" || p.type === "hashi" || p.type === "gokigen" ? cell : cell * 0.3);

// 1. The original Ma, whispered. Grid 440 low at the outer margin, day left and challenge right up top, caption beneath the grid's band.
const smOriginal = (() => { const p = P.masyu, c = 40, w = gw(p, c); return wrap(`<div class="page">
  <div style="position: absolute; left: ${LEFT}px; top: 96px;">${dayLine(63)}</div>
  <div style="position: absolute; right: ${RIGHT}px; top: 96px;">${challengeLine(3)}</div>
  ${smallGrid(p, c, PAGE_W - RIGHT - w, 400)}
  <div style="position: absolute; left: ${LEFT}px; top: 868px;">${whisper(p, { size: 10, width: 460 })}</div>
  ${folio(71, "right: 64px;")}
</div>`); })();

// 2. Gutter. Grid low at the gutter instead; day and challenge right-aligned up top; caption right-aligned beneath.
const smGutter = (() => { const p = P.gokigen, c = 40, w = gw(p, c); return wrap(`<div class="page">
  <div style="position: absolute; right: ${RIGHT}px; top: 96px; display: flex; gap: 36px; align-items: center;">${dayLine(47)}${challengeLine(3)}</div>
  ${smallGrid(p, c, LEFT - c * 0.5, 400)}
  <div style="position: absolute; right: ${RIGHT}px; top: 868px;">${whisper(p, { size: 10, width: 500, align: "right" })}</div>
  ${folio(55, "left: 72px;")}
</div>`); })();

// 3. Centred small. A 400 px grid centred low; day and challenge stacked at the gutter up top; caption beneath at the gutter.
const smCentred = (() => { const p = P.shikaku, c = 40, w = gw(p, c); return wrap(`<div class="page">
  <div style="position: absolute; left: ${LEFT}px; top: 96px; display: flex; flex-direction: column; gap: 14px;">${dayLine(58)}${challengeLine(2)}</div>
  ${smallGrid(p, c, (PAGE_W - w) / 2, 420)}
  <div style="position: absolute; left: ${LEFT}px; top: 868px;">${whisper(p, { size: 10, width: 460 })}</div>
  ${folio(66, "left: 0; right: 0; text-align: center;")}
</div>`); })();

// 4. Text up top. All the words in one whisper block at the top-left: day, challenge, then the caption. Grid low at the outer margin.
const smTextTop = (() => { const p = P.slither, c = 40, w = gw(p, c); return wrap(`<div class="page">
  <div style="position: absolute; left: ${LEFT}px; top: 96px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">${dayLine(22)}${challengeLine(2)}<div style="margin-top: 10px;">${whisper(p, { size: 10, width: 300 })}</div></div>
  ${smallGrid(p, c, PAGE_W - RIGHT - w, 420)}
  ${folio(30, "right: 64px;")}
</div>`); })();

// 5. Inverted diagonal. Grid high at the outer margin; all the words at the bottom-left, the empty space running down and left.
const smInverted = (() => { const p = P.hashi, c = 40, w = gw(p, c); return wrap(`<div class="page">
  ${smallGrid(p, c, PAGE_W - RIGHT - w, 84)}
  <div style="position: absolute; left: ${LEFT}px; bottom: 96px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">${dayLine(31)}${challengeLine(2)}<div style="margin-top: 10px;">${whisper(p, { size: 10, width: 320 })}</div></div>
  ${folio(39, "right: 64px;")}
</div>`); })();

// 6. Smallest. A 360 px grid low at the outer margin; one whisper line up top; caption at the bottom-left. The most empty page in the set.
const smSmallest = (() => { const p = P.nurikabe, c = 44, w = gw(p, c); return wrap(`<div class="page">
  <div style="position: absolute; left: ${LEFT}px; top: 96px; display: flex; gap: 36px; align-items: center;">${dayLine(14)}${challengeLine(3)}</div>
  ${smallGrid(p, c, PAGE_W - RIGHT - w, 470)}
  <div style="position: absolute; left: ${LEFT}px; top: 868px;">${whisper(p, { size: 10, width: 420 })}</div>
  ${folio(22, "right: 64px;")}
</div>`); })();

writeFileSync(join(OUT, "SmOriginal.dc.html"), smOriginal);
writeFileSync(join(OUT, "SmGutter.dc.html"), smGutter);
writeFileSync(join(OUT, "SmCentred.dc.html"), smCentred);
writeFileSync(join(OUT, "SmTextTop.dc.html"), smTextTop);
writeFileSync(join(OUT, "SmInverted.dc.html"), smInverted);
writeFileSync(join(OUT, "SmSmallest.dc.html"), smSmallest);


// =====================================================================================
// Chosen direction: small grid, words up top. Refined: no challenge label, 7 px dots, the day a
// touch heavier, and the day repeated in kanji numerals.
const KANJI_NUM = (n) => { const d = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]; if (n < 10) return d[n]; const t = Math.floor(n / 10), u = n % 10; return (t > 1 ? d[t] : "") + "十" + (u ? d[u] : ""); };
const tinyDots = (n, size = 7, gap = 6) => `<span style="display: inline-flex; gap: ${gap}px; align-items: center;">${Array.from({ length: 5 }, (_, i) => `<span style="width: ${size}px; height: ${size}px; border-radius: 50%; border: 1.1px solid ${ASH}; background: ${i < n ? ASH : "transparent"}; display: inline-block;"></span>`).join("")}</span>`;
const dayStrong = (day) => `<span style="font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; color: ${ASH};">Day ${day}</span>`;
const dayInk = (day) => `<span style="font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; color: ${INK};">Day ${day}</span>`;
const kanjiInk = (day) => `<span class="jp" style="font-size: 13px; letter-spacing: 0.12em; color: ${INK};">${KANJI_NUM(day)}</span>`;
const kanjiDay = (day, { brush = false, size = 13 } = {}) => `<span class="${brush ? "brush" : "jp"}" style="font-size: ${size}px; letter-spacing: 0.12em; color: ${ASH};">${KANJI_NUM(day)}</span>`;
const chosenPage = (p, day, band, topBlock) => { const c = 40, w = gw(p, c); return wrap(`<div class="page">
  <div style="position: absolute; left: ${LEFT}px; top: 96px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">
    ${topBlock}
    <div style="margin-top: 10px;">${whisper(p, { size: 10, width: 300 })}</div>
  </div>
  ${smallGrid(p, c, PAGE_W - RIGHT - w, 420)}
  ${folio(day + 8, "right: 64px;")}
</div>`); };

// Main: kanji inline after the day, same line; dots on the line below.
const chosenMain = chosenPage(P.slither, 22, 2, `<div style="display: flex; align-items: baseline; gap: 14px;">${dayStrong(22)}${kanjiDay(22)}</div>${tinyDots(2)}`);
// Alternate: kanji on its own line between the day and the dots.
const chosenKanjiBelow = chosenPage(P.masyu, 63, 3, `${dayStrong(63)}${kanjiDay(63)}${tinyDots(3)}`);
// Alternate: kanji in the brush face, a little larger, beside the day; dots below.
const chosenKanjiBrush = chosenPage(P.gokigen, 47, 3, `<div style="display: flex; align-items: baseline; gap: 14px;">${dayStrong(47)}${kanjiDay(47, { brush: true, size: 17 })}</div>${tinyDots(3)}`);

writeFileSync(join(OUT, "Main.dc.html"), chosenMain);
writeFileSync(join(OUT, "ChosenKanjiBelow.dc.html"), chosenKanjiBelow);
writeFileSync(join(OUT, "ChosenKanjiBrush.dc.html"), chosenKanjiBrush);
// Version of the lead: day in ink like the puzzle, dots smaller still (5 px).
const chosenInkDay = chosenPage(P.slither, 22, 2, `<div style="display: flex; align-items: baseline; gap: 14px;">${dayInk(22)}${kanjiInk(22)}</div>${tinyDots(2, 5, 5)}`);
writeFileSync(join(OUT, "ChosenInkDay.dc.html"), chosenInkDay);


// =====================================================================================
// Hand-inked, refined. Full-width grid with the hand-ruled wobble; day and dots up top at the
// refined weight; the genre caption a whisper at the bottom.
const inked = (p, scale, seed = 11) => { const cell = 536 / (p.params.cols + (p.type === "slitherlink" || p.type === "hashi" || p.type === "gokigen" ? 1 : 0.3)); return `
  <div style="position: absolute; left: 68px; top: 236px; width: 536px; height: 536px;">
    <svg width="0" height="0" style="position:absolute;"><defs><filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}"/></filter></defs></svg>
    <div style="width: 100%; height: 100%; filter: url(#ink);">${art(p, cell)}</div>
  </div>`; };
const topDay = (day, band, align = "left") => `<div style="position: absolute; ${align === "right" ? "right: 64px" : "left: 72px"}; top: 96px; display: flex; flex-direction: column; gap: 12px; align-items: ${align === "right" ? "flex-end" : "flex-start"};"><div style="display: flex; align-items: baseline; gap: 14px;">${dayStrong(day)}${kanjiDay(day)}</div>${tinyDots(band)}</div>`;
const bottomCaption = (p, side = "left") => `<div style="position: absolute; ${side}: ${side === "left" ? 72 : 64}px; top: 812px;">${whisper(p, { size: 10, width: side === "left" ? 460 : 536, align: side })}</div>`;
const hiPage = (p, day, band, { scale = 1.6, top = "left", bottom = "left", twoEnds = false, seed = 11 } = {}) => wrap(`<div class="page">
  ${twoEnds ? `<div style="position: absolute; left: 72px; right: 64px; top: 96px; display: flex; justify-content: space-between; align-items: baseline;"><div style="display: flex; align-items: baseline; gap: 14px;">${dayStrong(day)}${kanjiDay(day)}</div>${tinyDots(band)}</div>` : topDay(day, band, top)}
  ${inked(p, scale, seed)}
  ${bottomCaption(p, bottom)}
  ${folio(day + 8, bottom === "left" ? "right: 64px;" : "left: 72px;")}
</div>`);

const hiLeft = hiPage(P.shikaku, 58, 2);                                   // 1. left / left, subtle wobble
const hiStrong = hiPage(P.masyu, 63, 3, { scale: 2.8, seed: 5 });          // 2. left / left, stronger wobble
const hiRight = hiPage(P.gokigen, 47, 3, { top: "right", bottom: "right" }); // 3. right / right
const hiTwoEnds = hiPage(P.slither, 22, 2, { twoEnds: true });             // 4. day at the gutter, dots at the outer margin
const hiCross = hiPage(P.hashi, 31, 2, { top: "left", bottom: "right" }); // 5. crosswise
const hiNuri = hiPage(P.nurikabe, 14, 3, { scale: 2.2, seed: 9 });        // 6. nurikabe, medium wobble

const inkDots = (n, size = 5, gap = 5) => `<span style="display: inline-flex; gap: ${gap}px; align-items: center;">${Array.from({ length: 5 }, (_, i) => `<span style="width: ${size}px; height: ${size}px; border-radius: 50%; border: 1.1px solid ${INK}; background: ${i < n ? INK : "transparent"}; display: inline-block;"></span>`).join("")}</span>`;
const hiTwoEndsInk = wrap(`<div class="page">
  <div style="position: absolute; left: 72px; right: 64px; top: 96px; display: flex; justify-content: space-between; align-items: baseline;"><div style="display: flex; align-items: baseline; gap: 14px;">${dayInk(22)}${kanjiInk(22)}</div>${inkDots(2)}</div>
  ${inked(P.slither, 1.6)}
  ${bottomCaption(P.slither)}
  ${folio(30, "right: 64px;")}
</div>`);
writeFileSync(join(OUT, "HiTwoEndsInk.dc.html"), hiTwoEndsInk);
writeFileSync(join(OUT, "HiLeft.dc.html"), hiLeft);
writeFileSync(join(OUT, "HiStrong.dc.html"), hiStrong);
writeFileSync(join(OUT, "HiRight.dc.html"), hiRight);
writeFileSync(join(OUT, "HiTwoEnds.dc.html"), hiTwoEnds);
writeFileSync(join(OUT, "HiCross.dc.html"), hiCross);
writeFileSync(join(OUT, "HiNuri.dc.html"), hiNuri);

const maColumn = (() => { const p = P.slither, [name, kana] = NAMES[p.type]; return wrap(`<div class="page">
  <div style="position: absolute; right: 64px; top: 428px; width: 440px; height: 440px;">${art(p, 40)}</div>
  <div style="position: absolute; left: 72px; top: 428px; width: 84px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    ${dayInk(63)}
    ${kanjiInk(63)}
    <div style="margin-top: 2px;">${inkDots(3)}</div>
    <span style="margin-top: 14px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; color: ${ASH}; line-height: 1.6;">${name}</span>
    <span class="jp" style="font-size: 10px; letter-spacing: 0; color: ${ASH}; margin-top: -8px; white-space: nowrap;">${kana}</span>
  </div>
  <div class="folio" style="position: absolute; bottom: 34px; right: 64px;">71</div>
</div>`); })();
writeFileSync(join(OUT, "MaColumn.dc.html"), maColumn);
writeFileSync(join(OUT, "CreamAndInk.dc.html"), creamAndInk);
writeFileSync(join(OUT, "EnsoOpener.dc.html"), ensoOpener);
writeFileSync(join(OUT, "Tategaki.dc.html"), tategaki);
writeFileSync(join(OUT, "EarthAccent.dc.html"), earthAccent);
writeFileSync(join(OUT, "HandInked.dc.html"), handInked);
writeFileSync(join(OUT, "Ma.dc.html"), ma);
const A = (file, x, y, title) => ({ file, x, y, w: 672, h: 960, title, print: "fixed" });
writeFileSync(join(OUT, "canvas.json"), JSON.stringify({
  artboards: [
    A("CreamAndInk.dc.html", 0, 0, "Cream and ink"),
    A("EnsoOpener.dc.html", 800, 0, "Enso opener"),
    A("Tategaki.dc.html", 1600, 0, "Tategaki"),
    A("EarthAccent.dc.html", 0, 1160, "Earth accent (colour interior)"),
    A("HandInked.dc.html", 800, 1160, "Hand-inked"),
    A("Ma.dc.html", 1600, 1160, "Ma"),
    A("MaColumn.dc.html", 2400, 1160, "Ma · day and dots in the column"),
    { ...A("MaHighText.dc.html", 0, 0, "Ma · text high, grid low"), page: "page-2" },
    { ...A("MaHighGrid.dc.html", 800, 0, "Ma · grid high, text low"), page: "page-2" },
    { ...A("MaCentered.dc.html", 1600, 0, "Ma · centred"), page: "page-2" },
    { ...A("MaDiagonal.dc.html", 0, 1160, "Ma · diagonal"), page: "page-2" },
    { ...A("MaBottom.dc.html", 800, 1160, "Ma · bottom-anchored"), page: "page-2" },
    { ...A("MaBrush.dc.html", 1600, 1160, "Ma · brush name"), page: "page-2" },
    { ...A("DayNumeral.dc.html", 0, 0, "Day · numeral"), page: "page-3" },
    { ...A("DayDiagonal.dc.html", 800, 0, "Day · diagonal numeral"), page: "page-3" },
    { ...A("DayKanji.dc.html", 1600, 0, "Day · kanji"), page: "page-3" },
    { ...A("DayDots.dc.html", 0, 1160, "Day · dots as the mark"), page: "page-3" },
    { ...A("DayLabelBelow.dc.html", 800, 1160, "Day · label below"), page: "page-3" },
    { ...A("DayOnly.dc.html", 1600, 1160, "Day · day only"), page: "page-3" },
    { ...A("LbLeftStacked.dc.html", 0, 0, "Label below · left, stacked"), page: "page-4" },
    { ...A("LbLeftLine.dc.html", 800, 0, "Label below · left, one line"), page: "page-4" },
    { ...A("LbRightStacked.dc.html", 1600, 0, "Label below · right, stacked"), page: "page-4" },
    { ...A("LbTwoEnds.dc.html", 0, 1160, "Label below · two ends"), page: "page-4" },
    { ...A("LbCrosswise.dc.html", 800, 1160, "Label below · crosswise"), page: "page-4" },
    { ...A("LbAllBelow.dc.html", 1600, 1160, "Label below · all below"), page: "page-4" },
    { ...A("SmOriginal.dc.html", 0, 0, "Small grid · the original Ma, whispered"), page: "page-5" },
    { ...A("SmGutter.dc.html", 800, 0, "Small grid · at the gutter"), page: "page-5" },
    { ...A("SmCentred.dc.html", 1600, 0, "Small grid · centred"), page: "page-5" },
    { ...A("SmTextTop.dc.html", 0, 1160, "Small grid · words up top"), page: "page-5" },
    { ...A("SmInverted.dc.html", 800, 1160, "Small grid · inverted diagonal"), page: "page-5" },
    { ...A("SmSmallest.dc.html", 1600, 1160, "Small grid · smallest"), page: "page-5" },
    { ...A("Main.dc.html", 0, 0, "Chosen · kanji inline"), page: "page-6" },
    { ...A("ChosenKanjiBelow.dc.html", 800, 0, "Chosen · kanji on its own line"), page: "page-6" },
    { ...A("ChosenKanjiBrush.dc.html", 1600, 0, "Chosen · kanji in the brush face"), page: "page-6" },
    { ...A("ChosenInkDay.dc.html", 0, 1160, "Chosen · day in ink, 5 px dots"), page: "page-6" },
    { ...A("HiLeft.dc.html", 0, 0, "Hand-inked · left, subtle"), page: "page-7" },
    { ...A("HiStrong.dc.html", 800, 0, "Hand-inked · left, stronger wobble"), page: "page-7" },
    { ...A("HiRight.dc.html", 1600, 0, "Hand-inked · right"), page: "page-7" },
    { ...A("HiTwoEnds.dc.html", 0, 1160, "Hand-inked · two ends"), page: "page-7" },
    { ...A("HiCross.dc.html", 800, 1160, "Hand-inked · crosswise"), page: "page-7" },
    { ...A("HiNuri.dc.html", 1600, 1160, "Hand-inked · medium wobble"), page: "page-7" },
    { ...A("HiTwoEndsInk.dc.html", 2400, 1160, "Hand-inked · two ends, in ink"), page: "page-7" },
  ],
  pages: [{ id: "page-1", name: "Earth and ink" }, { id: "page-2", name: "Ma variants" }, { id: "page-3", name: "Day forward" }, { id: "page-4", name: "Label below, refined" }, { id: "page-5", name: "Ma, small grid" }, { id: "page-6", name: "Chosen" }, { id: "page-7", name: "Hand-inked, refined" }],
  annotations: [
    { id: "brief", x: 0, y: -260, w: 1240, text: "Earth and ink. Cream stock (#F3EEE3, free on black-and-white print-on-demand), one black ink, Cormorant Garamond for Latin, Yuji Syuku brush kana for the Japanese names, IBM Plex Sans digits inside the grids. All puzzles on these pages are real, verified-unique puzzles from the review batches. 7 × 10 in, right-hand pages, 0.75 in gutter." },
    { id: "n-main", x: 0, y: -120, w: 640, text: "Cream and ink. The base page. Type shrinks, the grid drops into the lower two thirds, nothing is ruled or boxed. The restraint is the design." },
    { id: "n-enso", x: 800, y: -120, w: 640, text: "Enso opener. One brush mark per genre section, drawn imperfect on purpose, the kana in a brush face. Used six times in the whole book, never on a puzzle page." },
    { id: "n-tategaki", x: 1600, y: -120, w: 640, text: "Tategaki. The genre runs vertically down the outer edge in Japanese, the day number appears twice, once in kanji. The Japanese carries the identity; the Latin is the caption." },
    { id: "n-earth", x: 0, y: 2180, w: 640, text: "Earth accent. One clay tone (#B5643C) on the day mark, difficulty and folio rules, nothing on the puzzle itself. Tradeoff: any colour switches the whole interior to colour printing, roughly two to three times the unit cost, and colour interiors print on white paper only." },
    { id: "n-hand", x: 800, y: 2180, w: 640, text: "Hand-inked. A faint wobble on the grid lines and digits, as though ruled by hand. Wabi-sabi in the object itself, not the decoration. Risk: at 300 dpi the wobble must stay under about 0.3 pt or it reads as a printing fault." },
    { id: "n-ma-col", x: 2400, y: 2180, w: 640, text: "Ma, column. The original Ma with the day, its kanji and the dots moved into the narrow column beside the grid, where the title and rules were. The genre name stays as a whisper below them; the rules are gone; nothing sits at the top of the page." },
    { id: "n-ma", x: 1600, y: 2180, w: 640, text: "Ma. Negative space as the subject: the top half is empty, the grid is smaller and sits low on the outer edge, the rules run in a narrow column. The quietest page, and the least conventional." },
    { id: "ma-brief", page: "page-2", x: 0, y: -230, w: 1240, text: "Ma variants. Every page here follows two rules: the grid owns its full horizontal band and shares it with nothing, and the name, Japanese name, rules and difficulty are one block. Only the block's position and the grid's size and position change. Same cream stock, ink and type as page one." },
    { id: "ma-1", page: "page-2", x: 0, y: -110, w: 640, text: "Text high, grid low. The default. The empty band between block and grid is the composition." },
    { id: "ma-2", page: "page-2", x: 800, y: -110, w: 640, text: "Grid high, text low. The eye lands on the puzzle first; the words wait underneath. Strongest for a book you open already knowing the rules." },
    { id: "ma-3", page: "page-2", x: 1600, y: -110, w: 640, text: "Centred. The block sits like a haiku, everything on one axis. Calmest and most formal; also the most conventional." },
    { id: "ma-4", page: "page-2", x: 0, y: 2170, w: 640, text: "Diagonal. Block flush right at the outer margin, smaller grid at the gutter. The emptiness runs corner to corner. Most tension, least symmetry." },
    { id: "ma-5", page: "page-2", x: 800, y: 2170, w: 640, text: "Bottom-anchored. Block and grid stack on the bottom margin; the whole top half is silence. Reads as one heavy object placed on a shelf." },
    { id: "ma-6", page: "page-2", x: 1600, y: 2170, w: 640, text: "Brush name. The kana leads the block in the brush face, the Latin becomes a small caption. Same geometry as the default with a different voice." },
    { id: "day-brief", page: "page-3", x: 0, y: -230, w: 1240, text: "Day forward. Built from the two favourites (text high / grid low, and diagonal). The day and the difficulty now carry the page; the genre name and rules are a whisper in ash grey, or gone. The assumption: each genre section opens with an enso page that names the puzzle and states its rules once." },
    { id: "day-1", page: "page-3", x: 0, y: -110, w: 640, text: "Numeral. A large light numeral at the gutter, five circles beneath, the genre and rule in 11 px ash. The grid keeps its full width." },
    { id: "day-2", page: "page-3", x: 800, y: -110, w: 640, text: "Diagonal numeral. Same block flush right at the outer edge, smaller grid at the gutter." },
    { id: "day-3", page: "page-3", x: 1600, y: -110, w: 640, text: "Kanji. The day in kanji numerals in the brush face, Arabic small beside it. Title kept, rules dropped." },
    { id: "day-4", page: "page-3", x: 0, y: 2170, w: 640, text: "Dots as the mark. The difficulty is the anchor: five large circles. The genre sits under the grid like a museum label." },
    { id: "day-5", page: "page-3", x: 800, y: 2170, w: 640, text: "Label below. Numeral and dots on one line up top; genre and rule become a 10 px caption beneath the grid." },
    { id: "day-6", page: "page-3", x: 1600, y: 2170, w: 640, text: "Day only. Nothing but the day and the dots. The grid is the only thing that says what it is. Purest, and the biggest bet on the opener pages doing their job." },
    { id: "lb-brief", page: "page-4", x: 0, y: -230, w: 1240, text: "Label below, refined. Day and challenge come down to the same whisper weight and ash colour as the caption: 13 px spaced capitals, 9 px circles. Day and its number sit together; the word Challenge sits beside the dots. No offsets. The grid keeps its band; the genre and one rule line stay as the caption beneath it." },
    { id: "lb-1", page: "page-4", x: 0, y: -110, w: 640, text: "Left, stacked. Day above challenge at the gutter. Caption below at the gutter." },
    { id: "lb-2", page: "page-4", x: 800, y: -110, w: 640, text: "Left, one line. Day and challenge on a single line, a wide space between them." },
    { id: "lb-3", page: "page-4", x: 1600, y: -110, w: 640, text: "Right, stacked. Everything at the outer margin, caption right-aligned too; the folio moves to the gutter." },
    { id: "lb-4", page: "page-4", x: 0, y: 2170, w: 640, text: "Two ends. Day at the gutter, challenge at the outer margin on one line, spanning the grid's width. Caption left." },
    { id: "lb-5", page: "page-4", x: 800, y: 2170, w: 640, text: "Crosswise. Day and challenge right-aligned above; caption left below. The two texts frame the grid diagonally." },
    { id: "lb-6", page: "page-4", x: 1600, y: 2170, w: 640, text: "All below. Nothing above the grid at all; caption left and day/challenge right share the line beneath it. The quietest of the six." },
    { id: "sm-brief", page: "page-5", x: 0, y: -230, w: 1240, text: "Ma, small grid. What the original Ma had that the later pages lost: a grid well short of the page width, so the emptiness reads as space rather than margin. Grids here are 440, 400 and 360 px (cells of 11.6, 10.6 and 9.5 mm, all comfortable for pencil). Day and challenge at whisper weight; the genre caption lives in its own band, never beside the grid." },
    { id: "sm-1", page: "page-5", x: 0, y: -110, w: 640, text: "The original Ma, whispered. Grid 440 low at the outer margin, day left and challenge right up top, caption beneath the grid's band. The closest to the page you missed." },
    { id: "sm-2", page: "page-5", x: 800, y: -110, w: 640, text: "At the gutter. The same grid low at the gutter instead; the words right-aligned. Empty space now sits at the outer edge where the thumb rests." },
    { id: "sm-3", page: "page-5", x: 1600, y: -110, w: 640, text: "Centred. A 400 px grid centred low; the words at the gutter. Calmer, more symmetrical, a little less Ma." },
    { id: "sm-4", page: "page-5", x: 0, y: 2170, w: 640, text: "Words up top. Day, challenge and caption gathered into one whisper block top-left; nothing under the grid. The reader takes in everything before the puzzle." },
    { id: "sm-5", page: "page-5", x: 800, y: 2170, w: 640, text: "Inverted diagonal. Grid high at the outer margin, all the words at the bottom-left. The emptiness runs down and to the left instead." },
    { id: "sm-6", page: "page-5", x: 1600, y: 2170, w: 640, text: "Smallest. A 360 px grid low at the outer margin, one whisper line up top, caption at the bottom-left. The most empty page in the set; check the 9.5 mm cells feel right in your hand." },
    { id: "ch-brief", page: "page-6", x: 0, y: -230, w: 1240, text: "Chosen: small grid, words up top. Refined per the brief: the Challenge label is gone and the five dots shrink to 7 px; the day line goes up a step in weight and size; the day is repeated in kanji numerals in the same ash. The genre caption stays a whisper beneath. Three placements for the kanji." },
    { id: "ch-1", page: "page-6", x: 0, y: -110, w: 640, text: "Kanji inline. The kanji follows the day on the same line, same size; the dots sit alone below. Lead candidate." },
    { id: "ch-2", page: "page-6", x: 800, y: -110, w: 640, text: "Kanji on its own line. Day, then kanji, then dots: three quiet lines." },
    { id: "ch-3", page: "page-6", x: 1600, y: -110, w: 640, text: "Kanji in the brush face. A little larger, beside the day, the only brush mark on the page." },
    { id: "ch-4", page: "page-6", x: 0, y: 2170, w: 640, text: "Day in ink. The kanji-inline lead with the day and kanji in the same black as the puzzle, and the dots down to 5 px. The day now belongs to the puzzle; the dots and caption stay ash." },
    { id: "hi-brief", page: "page-7", x: 0, y: -230, w: 1240, text: "Hand-inked, refined. A full-width 536 px grid with the hand-ruled wobble from page one; only the day (with kanji) and the dots up top, at the refined weight; the genre caption a whisper beneath. The wobble is an SVG displacement filter; at 300 dpi keep it under about 0.3 pt, which is the subtle setting here." },
    { id: "hi-1", page: "page-7", x: 0, y: -110, w: 640, text: "Left, subtle. Day and dots at the gutter, caption at the gutter, wobble at the print-safe setting." },
    { id: "hi-2", page: "page-7", x: 800, y: -110, w: 640, text: "Left, stronger wobble. Same page with the displacement nearly doubled, to see where hand-ruled turns into a printing fault." },
    { id: "hi-3", page: "page-7", x: 1600, y: -110, w: 640, text: "Right. Day and dots at the outer margin, caption right-aligned, folio at the gutter." },
    { id: "hi-4", page: "page-7", x: 0, y: 2170, w: 640, text: "Two ends. Day at the gutter, dots at the outer margin, on one line spanning the grid." },
    { id: "hi-5", page: "page-7", x: 800, y: 2170, w: 640, text: "Crosswise. Day and dots left above, caption right below." },
    { id: "hi-6", page: "page-7", x: 1600, y: 2170, w: 640, text: "Medium wobble on a Nurikabe grid, whose heavy border shows the effect most." },
    { id: "hi-7", page: "page-7", x: 2400, y: 2170, w: 640, text: "Two ends, in ink. The same page with the whole upper line, day, kanji and dots, in the puzzle's black, and the dots down to 5 px." },
  ],
  launch: { view: "canvas", page: "page-7" },
}, null, 2));
console.log("wrote 6 artboards to", OUT);
