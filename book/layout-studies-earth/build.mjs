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
};
// core SVG with the white ground removed so the paper shows through, and ink retinted
const INK = "#1A1917";
const art = (p, cell, extra = {}) => GENRES[p.type].render.svg(p, { cell, ...extra })
  .replace(/<rect width="[^"]+" height="[^"]+" fill="#fff"\/>/, "")
  .replace(/#1c1b18/g, INK)
  .replace(/<svg /, '<svg width="100%" height="100%" ');

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&amp;family=Yuji+Syuku&amp;family=Shippori+Mincho:wght@400;500&amp;family=IBM+Plex+Sans:wght@400;500&amp;display=swap">`;
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

writeFileSync(join(OUT, "Main.dc.html"), creamAndInk);
writeFileSync(join(OUT, "EnsoOpener.dc.html"), ensoOpener);
writeFileSync(join(OUT, "Tategaki.dc.html"), tategaki);
writeFileSync(join(OUT, "EarthAccent.dc.html"), earthAccent);
writeFileSync(join(OUT, "HandInked.dc.html"), handInked);
writeFileSync(join(OUT, "Ma.dc.html"), ma);
const A = (file, x, y, title) => ({ file, x, y, w: 672, h: 960, title, print: "fixed" });
writeFileSync(join(OUT, "canvas.json"), JSON.stringify({
  artboards: [
    A("Main.dc.html", 0, 0, "Cream and ink"),
    A("EnsoOpener.dc.html", 800, 0, "Enso opener"),
    A("Tategaki.dc.html", 1600, 0, "Tategaki"),
    A("EarthAccent.dc.html", 0, 1160, "Earth accent (colour interior)"),
    A("HandInked.dc.html", 800, 1160, "Hand-inked"),
    A("Ma.dc.html", 1600, 1160, "Ma"),
  ],
  annotations: [
    { id: "brief", x: 0, y: -260, w: 1240, text: "Earth and ink. Cream stock (#F3EEE3, free on black-and-white print-on-demand), one black ink, Cormorant Garamond for Latin, Yuji Syuku brush kana for the Japanese names, IBM Plex Sans digits inside the grids. All puzzles on these pages are real, verified-unique puzzles from the review batches. 7 × 10 in, right-hand pages, 0.75 in gutter." },
    { id: "n-main", x: 0, y: -120, w: 640, text: "Cream and ink. The base page. Type shrinks, the grid drops into the lower two thirds, nothing is ruled or boxed. The restraint is the design." },
    { id: "n-enso", x: 800, y: -120, w: 640, text: "Enso opener. One brush mark per genre section, drawn imperfect on purpose, the kana in a brush face. Used six times in the whole book, never on a puzzle page." },
    { id: "n-tategaki", x: 1600, y: -120, w: 640, text: "Tategaki. The genre runs vertically down the outer edge in Japanese, the day number appears twice, once in kanji. The Japanese carries the identity; the Latin is the caption." },
    { id: "n-earth", x: 0, y: 2180, w: 640, text: "Earth accent. One clay tone (#B5643C) on the day mark, difficulty and folio rules, nothing on the puzzle itself. Tradeoff: any colour switches the whole interior to colour printing, roughly two to three times the unit cost, and colour interiors print on white paper only." },
    { id: "n-hand", x: 800, y: 2180, w: 640, text: "Hand-inked. A faint wobble on the grid lines and digits, as though ruled by hand. Wabi-sabi in the object itself, not the decoration. Risk: at 300 dpi the wobble must stay under about 0.3 pt or it reads as a printing fault." },
    { id: "n-ma", x: 1600, y: 2180, w: 640, text: "Ma. Negative space as the subject: the top half is empty, the grid is smaller and sits low on the outer edge, the rules run in a narrow column. The quietest page, and the least conventional." },
  ],
  launch: { view: "canvas" },
}, null, 2));
console.log("wrote 6 artboards to", OUT);
