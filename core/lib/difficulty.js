// Provisional difficulty from oracle search effort. The oracle applies only rule-level propagation;
// every time it has to branch, a human would too (or would need a technique beyond direct inference).
// Replaced per genre by technique-ladder solvers later (PLAN.md §3.4) without changing the JSON shape.
export const BAND_LABELS = { 1: "Gentle", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Expert" };

export function provisionalRating({ branches, cells, clueDensity }) {
  // branches: DFS branch points the oracle needed to prove uniqueness.
  let band;
  if (branches === 0) band = clueDensity > 0.45 ? 1 : 2;
  else if (branches <= 2) band = 3;
  else if (branches <= 8) band = 4;
  else band = 5;
  const score = Math.round((band * 10 + Math.min(branches, 30) * 0.8 + (1 - clueDensity) * 10 + cells / 40) * 10) / 10;
  return { band, label: BAND_LABELS[band], score, rating_method: "provisional-search-branches", search_branches: branches };
}
