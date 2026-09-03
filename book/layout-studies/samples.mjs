import { Rng } from '../../core/lib/rng.js';
import { neighbors, blocksAround, flood, components } from '../../core/lib/grid.js';
import { writeFileSync } from 'node:fs';
const N = 10, rng = new Rng(parseInt(process.argv[3]||'20260903',10));
const isBorder = i => { const r = Math.floor(i/N), c = i%N; return r===0||c===0||r===N-1||c===N-1; };

// --- slitherlink: inside region -> loop -> partial clues
function inside() {
  const inn = new Uint8Array(N*N); let count = 1; inn[45] = 1;
  const target = Math.round(N*N*0.5);
  const cb = i => blocksAround(i,N,N).some(([a,b,c,d]) => (inn[a]&&inn[d]&&!inn[b]&&!inn[c])||(inn[b]&&inn[c]&&!inn[a]&&!inn[d]));
  const outOk = () => { const outs=[]; for(let i=0;i<N*N;i++) if(!inn[i]) outs.push(i); const b=outs.filter(isBorder); return flood(b.length?b:[outs[0]],N,N,j=>!inn[j]).size===outs.length; };
  let stale=0;
  while(count<target && stale<300){ const f=[]; for(let i=0;i<N*N;i++) if(!inn[i]&&neighbors(i,N,N).some(j=>inn[j])) f.push(i); const i=rng.pick(f); inn[i]=1;count++; if(cb(i)||!outOk()){inn[i]=0;count--;stale++;} else stale=0; }
  return inn;
}
const inn = inside();
const isIn = (r,c) => r>=0&&c>=0&&r<N&&c<N&&inn[r*N+c]===1;
const H=[],V=[]; for(let r=0;r<=N;r++){H.push([]);for(let c=0;c<N;c++)H[r].push(isIn(r-1,c)!==isIn(r,c)?1:0);} for(let r=0;r<N;r++){V.push([]);for(let c=0;c<=N;c++)V[r].push(isIn(r,c-1)!==isIn(r,c)?1:0);}
const sl = []; for(let r=0;r<N;r++){sl.push([]);for(let c=0;c<N;c++){const n=H[r][c]+H[r+1][c]+V[r][c]+V[r][c+1]; sl[r].push(rng.chance(0.52)?n:null);}}

// --- nurikabe: islands + sea
function nuri(){ for(let t=0;t<3000;t++){ const own=new Int16Array(N*N).fill(-1); const seeds=[]; 
  for(let k=0;k<9;k++){ let tries=0; while(tries++<100){ const i=rng.int(N*N); const r=Math.floor(i/N),c=i%N; if(seeds.every(s=>Math.max(Math.abs(Math.floor(s/N)-r),Math.abs(s%N-c))>=2)){seeds.push(i);own[i]=k;break;} } }
  const sizes=seeds.map(()=>rng.pick([1,2,2,3,3,4,4,5,6])); const cur=seeds.map(()=>1);
  for(let step=0;step<400;step++){ const k=rng.int(seeds.length); if(cur[k]>=sizes[k]) continue; const cells=[]; for(let i=0;i<N*N;i++) if(own[i]===k) cells.push(i);
    const cand=[]; for(const i of cells) for(const j of neighbors(i,N,N)) if(own[j]===-1 && neighbors(j,N,N).every(x=>own[x]===-1||own[x]===k)) cand.push(j);
    if(!cand.length) continue; own[rng.pick(cand)]=k; cur[k]++; }
  const sea=components(N,N,i=>own[i]===-1); if(sea.length!==1) continue;
  // repair 2x2 sea blocks by extending an adjacent island into one of the cells
  let bad=false; for(let pass=0;pass<3;pass++){ bad=false; for(let r=0;r<N-1;r++) for(let c=0;c<N-1;c++){ const a=r*N+c; const blk=[a,a+1,a+N,a+N+1]; if(!blk.every(i=>own[i]===-1)) continue;
      let fixed=false; for(const i of rng.shuffle(blk.slice())){ const ks=new Set(neighbors(i,N,N).map(j=>own[j]).filter(k=>k>=0)); if(ks.size===1){ own[i]=[...ks][0]; fixed=true; break; } } if(!fixed) bad=true; } if(!bad) break; }
  if(bad) continue; if(components(N,N,i=>own[i]===-1).length!==1) continue;
  const grid=[]; for(let r=0;r<N;r++){grid.push([]);for(let c=0;c<N;c++)grid[r].push(null);} 
  seeds.forEach((s,k)=>{ const cells=[]; for(let i=0;i<N*N;i++) if(own[i]===k) cells.push(i); const i=rng.pick(cells); grid[Math.floor(i/N)][i%N]=cells.length; });
  const shade=[]; for(let r=0;r<N;r++){shade.push([]);for(let c=0;c<N;c++)shade[r].push(own[r*N+c]===-1?1:0);} return {grid,shade}; } }
const nk = nuri();

// --- shikaku: guillotine partition
const rects=[]; (function split(r,c,h,w){ const a=h*w; if(a<=2 || (a<=12 && rng.chance(0.55))){rects.push([r,c,h,w]);return;} if(w>=h&&w>1){const k=rng.range(1,w-1);split(r,c,h,k);split(r,c+k,h,w-k);} else if(h>1){const k=rng.range(1,h-1);split(r,c,k,w);split(r+k,c,h-k,w);} else rects.push([r,c,h,w]); })(0,0,N,N);
const sk=[]; for(let r=0;r<N;r++){sk.push([]);for(let c=0;c<N;c++)sk[r].push(null);} for(const [r,c,h,w] of rects){ sk[r+rng.int(h)][c+rng.int(w)]=h*w; }

// --- SVG renderers (print style: 1 unit = 1 cell of 40px)
const S=40, P=6, W=N*S+2*P;
const font='IBM Plex Sans, Helvetica, Arial, sans-serif';
function svgSlither(clues, withLoop){ let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="100%" height="100%">`;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(clues[r][c]!=null) o+=`<text x="${P+c*S+S/2}" y="${P+r*S+S/2+8}" text-anchor="middle" font-family="${font}" font-size="22" fill="#1c1b18">${clues[r][c]}</text>`;
  if(withLoop){ for(let r=0;r<=N;r++) for(let c=0;c<N;c++) if(H[r][c]) o+=`<line x1="${P+c*S}" y1="${P+r*S}" x2="${P+(c+1)*S}" y2="${P+r*S}" stroke="#1c1b18" stroke-width="3.2" stroke-linecap="round"/>`; for(let r=0;r<N;r++) for(let c=0;c<=N;c++) if(V[r][c]) o+=`<line x1="${P+c*S}" y1="${P+r*S}" x2="${P+c*S}" y2="${P+(r+1)*S}" stroke="#1c1b18" stroke-width="3.2" stroke-linecap="round"/>`; }
  for(let r=0;r<=N;r++) for(let c=0;c<=N;c++) o+=`<circle cx="${P+c*S}" cy="${P+r*S}" r="2.1" fill="#1c1b18"/>`;
  return o+'</svg>'; }
function svgNuri(g, shade){ let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="100%" height="100%">`;
  if(shade) for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(shade[r][c]) o+=`<rect x="${P+c*S}" y="${P+r*S}" width="${S}" height="${S}" fill="#1c1b18"/>`;
  for(let k=0;k<=N;k++){ o+=`<line x1="${P+k*S}" y1="${P}" x2="${P+k*S}" y2="${P+N*S}" stroke="#1c1b18" stroke-width="${k===0||k===N?2:0.7}"/>`; o+=`<line x1="${P}" y1="${P+k*S}" x2="${P+N*S}" y2="${P+k*S}" stroke="#1c1b18" stroke-width="${k===0||k===N?2:0.7}"/>`; }
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(g[r][c]!=null) o+=`<text x="${P+c*S+S/2}" y="${P+r*S+S/2+8}" text-anchor="middle" font-family="${font}" font-size="22" fill="#1c1b18">${g[r][c]}</text>`;
  return o+'</svg>'; }
function svgShikaku(g, withRects){ let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="100%" height="100%">`;
  for(let k=0;k<=N;k++){ o+=`<line x1="${P+k*S}" y1="${P}" x2="${P+k*S}" y2="${P+N*S}" stroke="#1c1b18" stroke-width="${k===0||k===N?2:0.7}"/>`; o+=`<line x1="${P}" y1="${P+k*S}" x2="${P+N*S}" y2="${P+k*S}" stroke="#1c1b18" stroke-width="${k===0||k===N?2:0.7}"/>`; }
  if(withRects) for(const [r,c,h,w] of rects) o+=`<rect x="${P+c*S}" y="${P+r*S}" width="${w*S}" height="${h*S}" fill="none" stroke="#1c1b18" stroke-width="3"/>`;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(g[r][c]!=null) o+=`<text x="${P+c*S+S/2}" y="${P+r*S+S/2+8}" text-anchor="middle" font-family="${font}" font-size="22" fill="#1c1b18">${g[r][c]}</text>`;
  return o+'</svg>'; }
const out = { slither: svgSlither(sl,false), slitherSolved: svgSlither(sl,true), nuri: svgNuri(nk.grid,null), nuriSolved: svgNuri(nk.grid,nk.shade), shikaku: svgShikaku(sk,false), shikakuSolved: svgShikaku(sk,true) };
writeFileSync(process.argv[2]+'/samples'+(process.argv[4]||'')+'.json', JSON.stringify(out));
console.log('slither clues:', sl.flat().filter(x=>x!=null).length, 'nurikabe islands:', nk.grid.flat().filter(x=>x!=null).length, 'shikaku rects:', rects.length);
