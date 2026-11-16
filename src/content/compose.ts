import type { ComposeRequest, Segment, Session, ThemeId, Verse } from "../lib/types";
import { VISION, WARFARE } from "./modes";
import { choosePhoto } from "./photos";
import { THEME_BY_ID, THEMES, detectTheme } from "./themes";
import { getVerse, spokenReference, verseLines, versesFor, versesTagged } from "./verses";

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
  if (request.mode === "warfare" || request.mode === "vision") return composeModeLocally(request, pick);
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

  const id = newId();
  return {
    id,
    title: theme.title,
    subtitle: theme.subtitle,
    theme: theme.id,
    mode: "prayer",
    scene: theme.scene,
    photo: choosePhoto("prayer", theme.id, id),
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

/** The on-device version of a warfare prayer or a vision story. */
function composeModeLocally(request: ComposeRequest, pick: (n: number) => number): Session {
  const warfare = request.mode === "warfare";
  const pool = versesTagged(warfare ? "warfare" : "vision");
  const first = pool[pick(pool.length)];
  const second = pool.find((v) => v.id !== first.id) ?? first;
  const full = request.length === "full";
  const shared = request.intention.trim().length >= 12 ? excerpt(request.intention.trim()) : "";

  const segments: Segment[] = warfare
    ? [
        { kind: "arrive", title: "Stand", lines: shared ? [...WARFARE.arrive, `You named it: “${shared}.”`, "Good. Now we bring it under the name of Jesus."] : WARFARE.arrive, pauseAfter: 1.4 },
        scriptureSegment(first),
        { kind: "reflect", title: "Your ground", lines: WARFARE.reflect, pauseAfter: 2 },
        { kind: "pray", title: "Fight", lines: WARFARE.pray, pauseAfter: 2 },
        { kind: "declare", title: "Declare", lines: WARFARE.declare, pauseAfter: 2 },
        ...(full ? [scriptureSegment(second, "Take one more word with you into the fight.", 2)] : []),
        { kind: "bless", title: "Covered", lines: WARFARE.bless, pauseAfter: 1.5 },
      ]
    : [
        { kind: "arrive", title: "Close your eyes", lines: shared ? [...VISION.arrive.slice(0, 1), `You told me what you're praying for: “${shared}.”`, ...VISION.arrive.slice(1)] : VISION.arrive, pauseAfter: 1.4 },
        scriptureSegment(first),
        ...VISION.scenes.slice(0, full ? 3 : 2).map((scene): Segment => ({ kind: "story", title: scene.title, lines: scene.lines, pauseAfter: 2.4 })),
        { kind: "pray", title: "In His hands", lines: VISION.pray, pauseAfter: 2 },
        ...(full ? [{ kind: "declare", title: "Speak it", lines: VISION.declare, pauseAfter: 2 } satisfies Segment] : []),
        { kind: "bless", title: "Go gently", lines: VISION.bless, pauseAfter: 1.5 },
      ];

  const id = newId();
  const theme: ThemeId = warfare ? "courage" : "purpose";
  return {
    id,
    title: warfare ? WARFARE.title : VISION.title,
    subtitle: warfare ? WARFARE.subtitle : VISION.subtitle,
    theme,
    mode: request.mode,
    scene: warfare ? "ember" : "honey",
    photo: choosePhoto(request.mode ?? "prayer", theme, id),
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
