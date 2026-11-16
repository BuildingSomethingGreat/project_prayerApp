import type { Mode, ThemeId } from "../lib/types";

/** Names of the photographs in public/media/photos. Credits are in docs/CREDITS.md. */
export type PhotoId =
  | ThemeId
  | "open-hands"
  | "scripture"
  | "quiet-place"
  | "meadow"
  | "forest-light"
  | "forest-path"
  | "rays"
  | "waterfall"
  | "storm"
  | "mountain-sunrise"
  | "wildflowers"
  | "ocean"
  | "fjord"
  | "grass-sun";

/**
 * Where the subject sits in each photograph, as `object-position`. The same
 * image has to fill a tall phone and a wide desktop, so the crop is anchored
 * on what matters rather than on the centre.
 */
export const PHOTO_FOCUS: Record<PhotoId, string> = {
  peace: "45% 15%",
  rest: "42% 62%",
  purpose: "48% 68%",
  strength: "52% 62%",
  worth: "48% 38%",
  guidance: "50% 55%",
  gratitude: "52% 38%",
  provision: "38% 62%",
  comfort: "56% 42%",
  "loved-ones": "50% 45%",
  hope: "45% 42%",
  courage: "55% 38%",
  "open-hands": "58% 42%",
  scripture: "42% 50%",
  "quiet-place": "46% 62%",
  meadow: "30% 60%",
  "forest-light": "48% 40%",
  "forest-path": "55% 55%",
  rays: "25% 40%",
  waterfall: "50% 45%",
  storm: "60% 45%",
  "mountain-sunrise": "46% 55%",
  wildflowers: "50% 62%",
  ocean: "60% 50%",
  fjord: "40% 55%",
  "grass-sun": "40% 50%",
};

/** Photographs that suit each kind of moment. Prayer sessions use these for some themes and a portrait for the rest. */
const BY_MODE: Record<Exclude<Mode, "prayer">, PhotoId[]> = {
  warfare: ["waterfall", "storm", "fjord", "rays"],
  vision: ["meadow", "mountain-sunrise", "wildflowers", "grass-sun"],
};

const NATURE_FOR_THEME: Partial<Record<ThemeId, PhotoId>> = {
  peace: "forest-light",
  guidance: "forest-path",
  rest: "ocean",
  hope: "mountain-sunrise",
};

/** The photograph for a new session. `seed` (the session id) spreads sessions across the set. */
export function choosePhoto(mode: Mode, theme: ThemeId, seed: string): PhotoId {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  if (mode !== "prayer") return BY_MODE[mode][hash % BY_MODE[mode].length];
  // Half of the sessions on these themes get the landscape, half the portrait.
  const nature = NATURE_FOR_THEME[theme];
  return nature && hash % 2 === 0 ? nature : theme;
}

export const isPhoto = (id: string | undefined): id is PhotoId => Boolean(id && id in PHOTO_FOCUS);

export const photoUrl = (id: PhotoId) => `/media/photos/${id}.jpg`;
