import type { ComposeRequest, Segment, Session, ThemeId, Verse } from "../lib/types";
import { THEME_BY_ID, THEMES, detectTheme } from "./themes";
import { getVerse, spokenReference, verseLines, versesFor } from "./verses";

const ARRIVE = [
  "Welcome. This moment is yours.",
  "There is nowhere else you need to be.",
  "Let your shoulders drop. Unclench your jaw.",
  "Breathe in, slowly.",
  "And breathe out, a little longer than you breathed in.",
  "God is already here, and He is not in a hurry.",
];

/** Phrases that mean she needs a person, not only a prayer. */
const CRISIS = /suicid|kill myself|end my life|ending my life|don'?t want to (live|be here|be alive)|hurt(ing)? myself|self[- ]harm|no reason to live|better off without me/i;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A chip tap leaves only the starter phrase behind; that is not something to read back. */
function meaningful(intention: string): string {
  const text = intention.trim().replace(/\s+/g, " ");
  const isStarter = THEMES.some((t) => t.starter.trim() === text);
  return isStarter || text.length < 12 ? "" : text;
}

/** First couple of sentences of what she wrote, short enough to speak back gently. */
function excerpt(text: string, max = 180): string {
  if (text.length <= max) return text.replace(/[.!?,;:\s]+$/, "");
  const clipped = text.slice(0, max);
  const stop = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("? "), clipped.lastIndexOf("! "));
  const cut = stop > 60 ? stop : clipped.lastIndexOf(" ");
  return clipped.slice(0, cut).replace(/[.!?,;:\s]+$/, "");
}

export function scriptureSegment(verse: Verse, intro?: string, pauseAfter = 2.2): Segment {
  return {
    kind: "scripture",
    title: verse.ref,
    lines: [intro ?? `Hear these words from ${spokenReference(verse.ref)}.`, ...verseLines(verse.text)],
    verseId: verse.id,
    pauseAfter,
  };
}

/**
 * Writes a session entirely on the device from the theme library. Used when no
 * writing model is reachable, so the app always has something true to say.
 */
export function composeLocally(request: ComposeRequest, pick: (n: number) => number = (n) => Math.floor(Math.random() * n)): Session {
  const shared = meaningful(request.intention);
  const themeId: ThemeId = shared ? detectThemeOr(shared, request.themeHint) : (request.themeHint ?? "peace");
  const theme = THEME_BY_ID[themeId];
  const pool = versesFor(theme.id);
  const first = pool[pick(Math.min(pool.length, 3))];
  const second = pool.find((v) => v.id !== first.id) ?? first;

  const arrive: Segment = {
    kind: "arrive",
    title: "Arrive",
    lines: shared
      ? [...ARRIVE, "You came here carrying something.", `“${excerpt(shared)}.”`, "He has heard every word of it."]
      : ARRIVE,
    pauseAfter: 1.4,
  };

  const segments: Segment[] = [
    arrive,
    scriptureSegment(first),
    { kind: "reflect", title: "Reflect", lines: theme.reflect, pauseAfter: 2.2 },
    { kind: "pray", title: "Pray", lines: theme.pray, pauseAfter: 2 },
  ];

  if (request.length === "full") {
    segments.push({
      kind: "declare",
      title: "Speak life",
      lines: ["Now, agree with what God has already said about you.", "Say these with me, aloud or in your heart.", ...theme.declare],
      pauseAfter: 2,
    });
    if (second.id !== first.id) segments.push(scriptureSegment(second, "Carry one more word with you.", 2));
  }

  segments.push({ kind: "bless", title: "Go gently", lines: theme.bless, pauseAfter: 1.5 });

  return {
    id: newId(),
    title: theme.title,
    subtitle: theme.subtitle,
    theme: theme.id,
    scene: theme.scene,
    voice: request.voice,
    length: request.length,
    intention: request.intention.trim(),
    verseIds: segments.flatMap((s) => (s.verseId ? [s.verseId] : [])),
    segments,
    createdAt: Date.now(),
    source: "local",
    care: CRISIS.test(request.intention) || undefined,
  };
}

function detectThemeOr(text: string, hint?: ThemeId): ThemeId {
  const detected = detectTheme(text);
  // "peace" is also the detector's fallback, so a chip hint outranks it.
  return detected === "peace" && hint ? hint : detected;
}

/** Every verse a session quotes, in order, for the Scripture sheet. */
export function sessionVerses(session: Session): Verse[] {
  return session.verseIds.flatMap((id) => getVerse(id) ?? []);
}
