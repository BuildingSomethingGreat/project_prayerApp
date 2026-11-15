// Builds src/content/verses.json from a public-domain translation so that no
// Scripture text in the app is ever typed from memory or written by a model.
//
// Source: bible-api.com, World English Bible British Edition (WEBBE, public domain).
// Usage:  node scripts/fetch_verses.mjs
import { writeFileSync, mkdirSync } from "node:fs";
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
];

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

const verses = [];
for (const [ref, themes] of LIBRARY) {
  const text = await fetchVerse(ref);
  verses.push({ id: slug(ref), ref, text, themes });
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
