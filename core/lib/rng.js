// Deterministic PRNG (mulberry32). Every puzzle is reproducible from (genre, params, seed).
export class Rng {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n) { return Math.floor(this.next() * n); }               // 0..n-1
  range(a, b) { return a + this.int(b - a + 1); }               // a..b inclusive
  pick(arr) { return arr[this.int(arr.length)]; }
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = this.int(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  chance(p) { return this.next() < p; }
}
