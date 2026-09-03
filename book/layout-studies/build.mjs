import { readFileSync, writeFileSync } from 'node:fs';
const S = process.argv[2];
const A = JSON.parse(readFileSync(`${S}/samples.json`)), B = JSON.parse(readFileSync(`${S}/samples-b.json`));
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&amp;family=IBM+Plex+Sans:wght@400;500&amp;family=Zen+Old+Mincho&amp;display=swap">`;
const CSS = `
  body { margin: 0; background: #FBFAF6; color: #1C1B18; }
  a { color: #1C1B18; } a:hover { color: #55524B; }
  .page { width: 672px; height: 960px; background: #FBFAF6; position: relative; box-sizing: border-box; font-family: 'Newsreader', Georgia, 'Times New Roman', serif; }
  .label { font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #55524B; }
  .jp { font-family: 'Zen Old Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif; }
  .rules { font-size: 16px; line-height: 1.45; color: #1C1B18; text-wrap: pretty; }
  .dots { font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; font-size: 11px; letter-spacing: 0.22em; color: #1C1B18; }
  .folio { font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; font-size: 11px; color: #55524B; font-variant-numeric: tabular-nums; }
`;
const wrap = (body) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONTS}
  <style>${CSS}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;
const dots = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
const RULES = {
  slither: 'Connect the dots to draw a single loop. A number says how many of the four sides around it the loop uses. The loop never crosses itself or branches.',
  nuri: 'Shade cells to make one connected sea. Each number sits on an island of exactly that many cells. Islands never touch except at corners, and the sea never fills a 2×2 square.',
  shikaku: 'Divide the grid into rectangles. Each rectangle contains exactly one number, equal to its area.',
};

// ---------- Option A: Quiet (Nikoli-like). Recto page: gutter 72 left, outer 60 right.
const optionA = (num, name, jp, band, svg, rules) => wrap(`
<div class="page" style="padding: 72px 60px 60px 72px; display: flex; flex-direction: column; gap: 0;">
  <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #1C1B18; padding-bottom: 10px;">
    <div style="font-size: 30px; font-weight: 400; line-height: 1;">${num}</div>
    <div style="display: flex; gap: 14px; align-items: baseline;">
      <span style="font-size: 20px; font-style: italic;">${name}</span>
      <span class="dots">${dots(band)}</span>
    </div>
  </div>
  <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
    <div style="width: 540px; height: 540px;">${svg}</div>
  </div>
  <p class="rules" style="margin: 0; max-width: 460px;">${rules}</p>
  <div class="folio" style="position: absolute; bottom: 30px; left: 0; right: 0; text-align: center;">${num + 8}</div>
</div>`);

// ---------- Option B: Morning page (journal). Day eyebrow, kanji, timing fields, notes rules.
const optionB = (num, name, jp, band, svg, rules) => wrap(`
<div class="page" style="padding: 64px 60px 56px 72px; display: flex; flex-direction: column; gap: 22px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div class="label">Day ${num}</div>
      <div style="display: flex; align-items: baseline; gap: 16px;">
        <span style="font-size: 40px; font-weight: 300; line-height: 1; letter-spacing: -0.01em;">${name}</span>
        <span class="jp" style="font-size: 17px; color: #55524B;">${jp}</span>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
      <div class="label" style="letter-spacing: 0.1em;">Easy</div>
      <span class="dots">${dots(band)}</span>
    </div>
  </div>
  <div style="display: flex; justify-content: center;">
    <div style="width: 500px; height: 500px;">${svg}</div>
  </div>
  <p class="rules" style="margin: 0; font-size: 15px; color: #55524B; max-width: 500px; align-self: center;">${rules}</p>
  <div style="flex: 1;"></div>
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px;">
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="display: flex; gap: 10px; align-items: baseline;"><span class="label" style="letter-spacing: 0.1em;">Started</span><span style="flex: 1; border-bottom: 1px solid #A9A59B;"></span></div>
      <div style="display: flex; gap: 10px; align-items: baseline;"><span class="label" style="letter-spacing: 0.1em;">Finished</span><span style="flex: 1; border-bottom: 1px solid #A9A59B;"></span></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="display: flex; gap: 10px; align-items: baseline;"><span class="label" style="letter-spacing: 0.1em;">Notes</span><span style="flex: 1; border-bottom: 1px solid #A9A59B;"></span></div>
      <div style="border-bottom: 1px solid #A9A59B; height: 1px;"></div>
    </div>
  </div>
  <div class="folio" style="position: absolute; bottom: 28px; right: 60px;">${num + 8}</div>
</div>`);

// ---------- Option C: Editorial. Large numeral, vertical running head on the spine side, puzzle to the outer edge.
const optionC = (num, name, jp, band, svg, rules) => wrap(`
<div class="page" style="padding: 0;">
  <div style="position: absolute; left: 72px; top: 56px; font-size: 112px; font-weight: 300; line-height: 0.85; letter-spacing: -0.03em;">${num}</div>
  <div style="position: absolute; left: 76px; top: 176px;" class="dots">${dots(band)}</div>
  <div style="position: absolute; left: 30px; bottom: 60px; transform: rotate(-90deg); transform-origin: left bottom; white-space: nowrap; display: flex; gap: 14px; align-items: baseline;">
    <span class="label" style="font-size: 12px;">${name}</span>
    <span class="jp" style="font-size: 13px; color: #55524B;">${jp}</span>
  </div>
  <div style="position: absolute; right: 60px; top: 220px; width: 540px; height: 540px;">${svg}</div>
  <p class="rules" style="position: absolute; left: 72px; bottom: 84px; width: 300px; margin: 0; font-size: 15px;">${rules}</p>
  <div class="folio" style="position: absolute; bottom: 30px; right: 60px;">${num + 8}</div>
</div>`);

// ---------- Solutions page: six to a page, back of the book, same running-head system as Option A.
const solutions = (items) => wrap(`
<div class="page" style="padding: 72px 60px 60px 72px; display: flex; flex-direction: column; gap: 22px;">
  <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #1C1B18; padding-bottom: 10px;">
    <span style="font-size: 20px; font-style: italic;">Solutions</span>
    <span class="label">Days 13 – 18</span>
  </div>
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 40px; flex: 1; align-content: start;">
    ${items.map(([n, svg]) => `<div style="display: flex; flex-direction: column; gap: 8px;"><div class="label" style="letter-spacing: 0.1em;">${n}</div><div style="width: 200px; height: 200px;">${svg}</div></div>`).join('\n    ')}
  </div>
  <div class="folio" style="position: absolute; bottom: 30px; left: 0; right: 0; text-align: center;">389</div>
</div>`);

writeFileSync('Main.dc.html', optionA(14, 'Slitherlink', 'スリザーリンク', 2, A.slither, RULES.slither));
writeFileSync('OptionB.dc.html', optionB(14, 'Slitherlink', 'スリザーリンク', 2, A.slither, RULES.slither));
writeFileSync('OptionC.dc.html', optionC(14, 'Slitherlink', 'スリザーリンク', 2, A.slither, RULES.slither));
writeFileSync('NurikabePage.dc.html', optionA(15, 'Nurikabe', 'ぬりかべ', 3, A.nuri, RULES.nuri));
writeFileSync('ShikakuPage.dc.html', optionA(16, 'Shikaku', '四角に切れ', 1, A.shikaku, RULES.shikaku));
writeFileSync('Solutions.dc.html', solutions([[13, B.shikakuSolved], [14, A.slitherSolved], [15, A.nuriSolved], [16, A.shikakuSolved], [17, B.slitherSolved], [18, B.nuriSolved]]));
const P = (file, x, y, title) => ({ file, x, y, w: 672, h: 960, title, print: 'fixed' });
writeFileSync('canvas.json', JSON.stringify({
  artboards: [
    P('Main.dc.html', 0, 0, 'Option A · Quiet'),
    P('OptionB.dc.html', 800, 0, 'Option B · Morning page'),
    P('OptionC.dc.html', 1600, 0, 'Option C · Editorial'),
    P('NurikabePage.dc.html', 0, 1140, 'Option A · Nurikabe'),
    P('ShikakuPage.dc.html', 800, 1140, 'Option A · Shikaku'),
    P('Solutions.dc.html', 1600, 1140, 'Solutions · six per page'),
  ],
  annotations: [
    { id: 'note-a', x: 0, y: -170, w: 640, text: 'Option A · Quiet. Closest to Nikoli. One rule line, a hairline running head, the grid as the only object on the page. Tradeoff: little room for the morning-ritual framing (day, time, notes).' },
    { id: 'note-b', x: 800, y: -170, w: 640, text: 'Option B · Morning page. Built around the ritual: Day number, Japanese name, started/finished fields and a notes rule. Tradeoff: busiest page; the grid is 500 px instead of 540 px.' },
    { id: 'note-c', x: 1600, y: -170, w: 640, text: 'Option C · Editorial. Asymmetric. Big numeral, running head turned up the spine, grid pushed to the outer edge where the thumb lands. Tradeoff: boldest identity, least conventional for a puzzle book.' },
    { id: 'note-system', x: 0, y: 2160, w: 1000, text: 'Second row: Option A applied to Nurikabe and Shikaku to show one system carrying several genres, plus a solutions page at six per page. All pages are 7 × 10 in (672 × 960 px at 96 px/in), black ink only, recto pages with a 0.75 in gutter. Puzzles shown are layout samples: valid structures, not yet verified for a unique solution.' },
  ],
  launch: { view: 'canvas' },
}, null, 2));
console.log('artboards written');
