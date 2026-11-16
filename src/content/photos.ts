import type { ThemeId } from "../lib/types";

/** Names of the photographs in public/media/photos. Credits are in docs/CREDITS.md. */
export type PhotoId = ThemeId | "open-hands" | "scripture" | "quiet-place";

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
};

export const photoUrl = (id: PhotoId) => `/media/photos/${id}.jpg`;
