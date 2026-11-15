import type { ThemeId, Verse } from "../lib/types";
import library from "./verses.json";

/** Built by scripts/fetch_verses.mjs. Never edit the text by hand. */
export const VERSES: Verse[] = library.verses.map((v) => ({ ...v, text: unquote(v.text) }));
export const TRANSLATION = { name: library.translation, abbreviation: library.abbreviation };

/**
 * An excerpt often begins or ends halfway through a quotation, which leaves
 * stray, unbalanced quote marks. Drop the quote marks (never the words) and
 * keep apostrophes.
 */
function unquote(text: string): string {
  return text
    .replace(/[“”‘]/g, "")
    .replace(/(?<![A-Za-z])’/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const BY_ID = new Map(VERSES.map((v) => [v.id, v]));

export function getVerse(id: string): Verse | undefined {
  return BY_ID.get(id);
}

/** Verses for a theme, those whose home theme it is first. */
export function versesFor(theme: ThemeId): Verse[] {
  const home = VERSES.filter((v) => v.themes[0] === theme);
  const related = VERSES.filter((v) => v.themes[0] !== theme && v.themes.includes(theme));
  return [...home, ...related];
}

const ORDINALS: Record<string, string> = { "1": "First", "2": "Second", "3": "Third" };

/** "2 Corinthians 12:9" → "Second Corinthians, chapter 12" — how a person would say it aloud. */
export function spokenReference(ref: string): string {
  const match = ref.match(/^(?:(\d)\s+)?(.+?)\s+(\d+):/);
  if (!match) return ref;
  const [, ordinal, book, chapter] = match;
  const name = ordinal ? `${ORDINALS[ordinal]} ${book}` : book;
  return book === "Psalm" ? `Psalm ${chapter}` : `${name}, chapter ${chapter}`;
}

/**
 * Breaks a passage into phrases short enough to read as one lyric line,
 * without changing a single word of it.
 */
export function verseLines(text: string, max = 110): string[] {
  const sentences = text.split(/(?<=[.!?][”’"']?)\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const sentence of sentences) {
    let rest = sentence;
    while (rest.length > max) {
      const middle = rest.length / 2;
      let cut = -1;
      for (const m of rest.matchAll(/[,;:—]\s/g)) {
        if (cut === -1 || Math.abs(m.index - middle) < Math.abs(cut - middle)) cut = m.index;
      }
      if (cut < 12 || cut > rest.length - 12) break;
      lines.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 2);
    }
    lines.push(rest);
  }
  return lines;
}

/** The same verse for everyone on a given day. */
export function verseOfTheDay(date = new Date()): Verse {
  const day = Math.floor(date.getTime() / 86_400_000);
  return VERSES[day % VERSES.length];
}
