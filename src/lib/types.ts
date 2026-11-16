export type SceneId = "dawn" | "ember" | "honey" | "dusk";
export type VoiceId = "naomi" | "elodie" | "gideon";
export type SessionLength = "short" | "full";

export type ThemeId =
  | "peace"
  | "rest"
  | "purpose"
  | "strength"
  | "worth"
  | "guidance"
  | "gratitude"
  | "provision"
  | "comfort"
  | "loved-ones"
  | "hope"
  | "courage";

export type SegmentKind = "arrive" | "scripture" | "reflect" | "story" | "pray" | "declare" | "bless";

/**
 * What kind of moment this is.
 * - prayer: a friend praying with her about what she shared.
 * - warfare: a bold prayer of spiritual warfare, standing in Christ's victory.
 * - vision: an immersive, present-tense story of the life she is asking God for.
 */
export type Mode = "prayer" | "warfare" | "vision";

export interface Verse {
  id: string;
  ref: string;
  text: string;
  themes: string[];
}

/** One "track" of a session. Each line is shown as a lyric line and spoken as one phrase. */
export interface Segment {
  kind: SegmentKind;
  title: string;
  lines: string[];
  /** Set on scripture segments; the text itself always comes from the verse library. */
  verseId?: string;
  /** Seconds of quiet after the segment ends. */
  pauseAfter: number;
}

export interface Session {
  id: string;
  title: string;
  subtitle: string;
  theme: ThemeId;
  /** Absent on sessions made before modes existed; treat as "prayer". */
  mode?: Mode;
  scene: SceneId;
  /** The photograph behind this session. Absent on older sessions, which use the theme's. */
  photo?: string;
  voice: VoiceId;
  length: SessionLength;
  intention: string;
  verseIds: string[];
  segments: Segment[];
  createdAt: number;
  /** Who wrote the words: Claude on the server, or the on-device composer. */
  source: "claude" | "local";
  /** Set when what she shared suggests she may be in crisis; the player then shows where to find help. */
  care?: boolean;
}

export interface ComposeRequest {
  mode?: Mode;
  intention: string;
  themeHint?: ThemeId;
  voice: VoiceId;
  length: SessionLength;
}

export interface Capabilities {
  compose: boolean;
  speech: boolean;
}
