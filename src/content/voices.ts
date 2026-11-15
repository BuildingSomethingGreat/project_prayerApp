import type { SceneId, VoiceId } from "../lib/types";

/** The three narrators. Each has a preview clip in public/media/voices. */
export const VOICES: { id: VoiceId; name: string; tone: string; art: SceneId }[] = [
  { id: "naomi", name: "Naomi", tone: "Warm and grounded", art: "dawn" },
  { id: "elodie", name: "Elodie", tone: "Soft and bright", art: "honey" },
  { id: "gideon", name: "Gideon", tone: "Deep and steady", art: "dusk" },
];
