// Builds src/content/verses.json from a public-domain translation so that no
// Scripture text in the app is ever typed from memory or written by a model.
//
// Source: bible-api.com, World English Bible British Edition (WEBBE, public domain).
// Usage:  node scripts/fetch_verses.mjs
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TRANSLATION = "webbe";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../src/content/verses.json");

/** [reference, themes] — the first theme listed is the verse's home theme. */
const LIBRARY = [
  ["Philippians 4:6-7", ["peace", "gratitude"]],
  ["John 14:27", ["peace", "courage"]],
  ["Isaiah 26:3", ["peace", "guidance"]],
  ["Psalm 46:10", ["peace", "rest"]],
  ["Matthew 11:28-30", ["rest", "peace"]],
  ["Psalm 23:1-3", ["rest", "provision"]],
  ["Psalm 4:8", ["rest", "peace"]],
  ["Exodus 33:14", ["rest", "guidance"]],
  ["Jeremiah 29:11", ["purpose", "hope"]],
  ["Proverbs 16:3", ["purpose", "guidance"]],
  ["Ephesians 2:10", ["purpose", "worth"]],
  ["Philippians 1:6", ["purpose", "hope"]],
  ["Psalm 37:4-5", ["purpose", "provision"]],
  ["Isaiah 40:31", ["strength", "hope"]],
  ["Isaiah 41:10", ["strength", "courage"]],
  ["2 Corinthians 12:9", ["strength", "worth"]],
  ["Philippians 4:13", ["strength", "purpose"]],
  ["Joshua 1:9", ["courage", "strength"]],
  ["Psalm 139:13-14", ["worth"]],
  ["Zephaniah 3:17", ["worth", "peace"]],
  ["Romans 8:38-39", ["worth", "courage"]],
  ["1 John 3:1", ["worth"]],
  ["Proverbs 3:5-6", ["guidance", "purpose"]],
  ["Psalm 32:8", ["guidance"]],
  ["James 1:5", ["guidance"]],
  ["Psalm 119:105", ["guidance", "hope"]],
  ["Psalm 118:24", ["gratitude"]],
  ["1 Thessalonians 5:16-18", ["gratitude", "peace"]],
  ["Lamentations 3:22-23", ["gratitude", "hope"]],
  ["James 1:17", ["gratitude", "provision"]],
  ["Philippians 4:19", ["provision"]],
  ["Matthew 6:33-34", ["provision", "peace"]],
  ["Psalm 34:18", ["comfort"]],
  ["Psalm 147:3", ["comfort"]],
  ["2 Corinthians 1:3-4", ["comfort", "strength"]],
  ["Isaiah 43:2", ["comfort", "courage"]],
  ["Numbers 6:24-26", ["loved-ones", "peace"]],
  ["3 John 1:2", ["loved-ones"]],
  ["Psalm 121:7-8", ["loved-ones", "courage"]],
  ["1 Corinthians 13:4-7", ["loved-ones", "worth"]],
  ["Romans 15:13", ["hope", "peace"]],
  ["Psalm 27:13-14", ["hope", "courage"]],
  ["Isaiah 43:19", ["hope", "purpose"]],
  ["2 Timothy 1:7", ["courage", "strength"]],
  ["Deuteronomy 31:8", ["courage", "comfort"]],
  ["Psalm 56:3-4", ["courage", "peace"]],

  // Spiritual warfare: standing in what Christ has already won.
  ["Ephesians 6:10-13", ["warfare"]],
  ["2 Corinthians 10:4-5", ["warfare"]],
  ["James 4:7", ["warfare"]],
  ["Isaiah 54:17", ["warfare"]],
  ["Luke 10:19", ["warfare"]],
  ["1 John 4:4", ["warfare", "courage"]],
  ["Romans 8:37", ["warfare", "strength"]],
  ["Romans 8:31", ["warfare", "courage"]],
  ["Psalm 91:1-4", ["warfare", "rest"]],
  ["2 Chronicles 20:15", ["warfare"]],
  ["Exodus 14:14", ["warfare", "peace"]],
  ["Colossians 2:15", ["warfare"]],
  ["Psalm 18:2", ["warfare", "strength"]],
  ["Zechariah 4:6", ["warfare", "strength"]],
  ["Psalm 46:1", ["warfare", "comfort"]],

  // Vision: seeing, in faith, the life she is asking God for.
  ["Habakkuk 2:2-3", ["vision", "hope"]],
  ["Ephesians 3:20", ["vision", "purpose"]],
  ["Hebrews 11:1", ["vision", "hope"]],
  ["Psalm 126:1-3", ["vision", "gratitude"]],
  ["Joel 2:25-26", ["vision", "hope"]],
  ["Isaiah 60:1", ["vision", "purpose"]],
  ["Psalm 23:5-6", ["vision", "provision"]],
  ["Numbers 23:19", ["vision", "hope"]],
  ["Mark 11:24", ["vision"]],
  ["Psalm 20:4", ["vision", "purpose"]],
  ["Jeremiah 33:3", ["vision", "guidance"]],
];

/** Verses whose home is elsewhere but which also belong to another collection. */
const ALSO = {
  "Jeremiah 29:11": ["vision"],
  "Isaiah 43:19": ["vision"],
  "Psalm 37:4-5": ["vision"],
  "Proverbs 16:3": ["vision"],
  "Philippians 1:6": ["vision"],
  "Isaiah 41:10": ["warfare"],
  "2 Timothy 1:7": ["warfare"],
  "Joshua 1:9": ["warfare"],
  "Deuteronomy 31:8": ["warfare"],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (ref) => ref.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Poetry comes back with hard line breaks; the app reads and speaks it as prose. */
const tidy = (text) =>
  text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

async function fetchVerse(ref, attempt = 1) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${TRANSLATION}`;
  const res = await fetch(url);
  if (res.status === 429 && attempt < 5) {
    await sleep(8000 * attempt);
    return fetchVerse(ref, attempt + 1);
  }
  if (!res.ok) throw new Error(`${ref}: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.text) throw new Error(`${ref}: empty response`);
  return tidy(data.text);
}

// Text already fetched is kept, so adding a verse only fetches the new one.
const known = existsSync(OUT) ? new Map(JSON.parse(readFileSync(OUT, "utf8")).verses.map((v) => [v.id, v.text])) : new Map();

const verses = [];
for (const [ref, home] of LIBRARY) {
  const id = slug(ref);
  const themes = [...home, ...(ALSO[ref] ?? [])];
  if (known.has(id)) {
    verses.push({ id, ref, text: known.get(id), themes });
    continue;
  }
  const text = await fetchVerse(ref);
  verses.push({ id, ref, text, themes });
  console.log(`✓ ${ref}`);
  await sleep(2300); // the API allows 15 requests per 30 seconds
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    { translation: "World English Bible (British Edition)", abbreviation: "WEBBE", license: "Public Domain", verses },
    null,
    2,
  ) + "\n",
);
console.log(`\nWrote ${verses.length} verses to ${OUT}`);
