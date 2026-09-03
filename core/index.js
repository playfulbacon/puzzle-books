// Registry of genres. One import for the CLI, the review app, and the book pipeline.
import slitherlink from "./genres/slitherlink/index.js";
import shikaku from "./genres/shikaku/index.js";
import nurikabe from "./genres/nurikabe/index.js";
export const GENERATOR_VERSION = "0.2.0";
export const GENRES = { slitherlink, shikaku, nurikabe };
export const genre = (id) => GENRES[id];
export { BAND_LABELS } from "./lib/difficulty.js";
