import type { SceneId } from "../lib/types";

/** Three colours per scene: the deep edge, the body, and the hot core. Linear-ish sRGB, 0–1. */
export const PALETTES: Record<SceneId, [number, number, number][]> = {
  dawn: [
    [0.86, 0.16, 0.05],
    [1.0, 0.42, 0.08],
    [1.0, 0.8, 0.42],
  ],
  ember: [
    [0.7, 0.04, 0.22],
    [1.0, 0.24, 0.1],
    [1.0, 0.68, 0.28],
  ],
  honey: [
    [0.92, 0.2, 0.34],
    [1.0, 0.56, 0.1],
    [1.0, 0.86, 0.44],
  ],
  dusk: [
    [0.4, 0.1, 0.78],
    [0.98, 0.2, 0.5],
    [1.0, 0.62, 0.24],
  ],
};
