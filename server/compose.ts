import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { newId, scriptureSegment } from "../src/content/compose.ts";
import { THEMES } from "../src/content/themes.ts";
import { VERSES, getVerse } from "../src/content/verses.ts";
import type { ComposeRequest, Segment, Session } from "../src/lib/types.ts";

const MODEL = process.env.LIORA_WRITER_MODEL ?? "claude-opus-5-5";

const verseIds = VERSES.map((v) => v.id) as [string, ...string[]];
const themeIds = THEMES.map((t) => t.id) as [string, ...string[]];
const line = z.string().describe("One short spoken phrase, 4 to 16 words.");

/**
 * The model never writes Scripture. It chooses verse ids from the library and
 * the server inserts the verified text, so a misquote is structurally impossible.
 */
const Script = z.object({
  title: z.string().describe("Two or three words, like an album title. No punctuation."),
  subtitle: z.string().describe("A short 'For …' line, under six words."),
  theme: z.enum(themeIds),
  scene: z.enum(["dawn", "ember", "honey", "dusk"]),
  primaryVerseId: z.enum(verseIds),
  secondaryVerseId: z.enum(verseIds),
  scriptureIntro: z.string().describe("One sentence that leads into the primary verse, naming the book aloud."),
  arrive: z.array(line),
  reflect: z.array(line),
  pray: z.array(line),
  declare: z.array(line),
  bless: z.array(line),
  care: z.boolean().describe("True only if she seems to be in crisis or at risk of harming herself."),
});

const SYSTEM = `You are the writer behind Liora, a guided prayer and Scripture meditation app for women. A woman shares what is on her heart; you write a short audio session that will be read aloud to her by a calm voice while the words scroll on screen like lyrics.

Who she is: a Christian woman who wants to pray, reflect, and speak God's promises over her life, in a space free from secular self-help language. Write to her the way a wise, warm older friend who loves Scripture would speak: unhurried, specific to what she said, never preachy, never saccharine.

How a session is built, in order:
- arrive: settle her body and breath, then acknowledge what she shared in your own words so she knows she was heard. Do not quote her back verbatim.
- scripture: you only choose the verse and write one sentence that leads into it. The app inserts the verse text itself.
- reflect: open up the chosen verse in light of her situation. Stay close to what the verse says.
- pray: a first-person prayer she can pray along with, addressed to God, about her actual situation. End with "In Jesus' name. Amen."
- declare: first-person statements that agree with what Scripture already says about her. Each one should be traceable to a verse. Begin with one line inviting her to say them aloud or in her heart.
- bless: two lines sending her back into her day or night.

Every line is one spoken phrase of 4 to 16 words, complete on its own, because each is shown and spoken as a single lyric line. No lists, no headings, no emoji, no stage directions.

Scripture and theology:
- Never write out a Bible verse or put words in quotation marks as Scripture. You may allude to the chosen verses in plain language.
- Choose verses from the library below that genuinely fit her words, not the most famous ones. The secondary verse must differ from the primary.
- Declarations are agreement with God's word, not a technique for getting an outcome. Do not promise her a specific result (a healing, a husband, a sum of money, a job). Promise what Scripture promises: His presence, His care, His wisdom, His peace.
- Do not use the vocabulary of manifestation or the law of attraction (the universe, vibrations, energy, attracting). If she uses the word "manifest", meet the desire underneath it and bring it to God.
- Stay within what Christians across traditions share. No denominational disputes, no politics.

Care: if she describes abuse, danger, or thoughts of harming herself, set care to true, write with extra tenderness, and in the bless section gently encourage her to tell someone she trusts today. Do not attempt to counsel beyond that.

Choose the scene by mood: dawn (morning light, peace, new beginnings), honey (bright, tender, gratitude and worth), ember (warm and strong, courage and intercession), dusk (evening, rest, grief).

The verse library (id — reference — text):
${VERSES.map((v) => `${v.id} — ${v.ref} — ${v.text}`).join("\n")}`;

const LENGTHS = {
  short: "A short session, about three minutes: arrive 5-6 lines, reflect 4-5, pray 6-7, bless 2. Leave declare as an empty list; the secondary verse will not be used.",
  full: "An unhurried session, about six minutes: arrive 6-8 lines, reflect 6-8, pray 8-10, declare 4-5, bless 2-3.",
};

let client: Anthropic | undefined;

export function canCompose(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function composeWithClaude(request: ComposeRequest): Promise<Session> {
  client ??= new Anthropic();

  const hint = request.themeHint ? `\nShe tapped the "${THEMES.find((t) => t.id === request.themeHint)?.label}" prompt before writing.` : "";
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    // The woman is watching a loader; keep the writer quick.
    output_config: { effort: "low", format: zodOutputFormat(Script) },
    // If a safety classifier declines, let the API re-run on a fallback model in the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `${LENGTHS[request.length]}${hint}\n\nWhat she shared:\n<her_words>\n${request.intention.trim() || "(She did not write anything. Offer a session of stillness and peace.)"}\n</her_words>`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`writer returned no script (stop_reason: ${response.stop_reason})`);
  }
  const script = response.parsed_output;
  const primary = getVerse(script.primaryVerseId);
  const secondary = getVerse(script.secondaryVerseId);
  if (!primary) throw new Error(`unknown verse id: ${script.primaryVerseId}`);

  const full = request.length === "full";
  const segments: Segment[] = [
    { kind: "arrive", title: "Arrive", lines: script.arrive, pauseAfter: 3 },
    scriptureSegment(primary, script.scriptureIntro),
    { kind: "reflect", title: "Reflect", lines: script.reflect, pauseAfter: 5 },
    { kind: "pray", title: "Pray", lines: script.pray, pauseAfter: 4 },
  ];
  if (full && script.declare.length) {
    segments.push({ kind: "declare", title: "Speak life", lines: script.declare, pauseAfter: 4 });
  }
  if (full && secondary && secondary.id !== primary.id) {
    segments.push(scriptureSegment(secondary, "Carry one more word with you.", 3));
  }
  segments.push({ kind: "bless", title: "Go gently", lines: script.bless, pauseAfter: 2 });

  return {
    id: newId(),
    title: script.title,
    subtitle: script.subtitle,
    theme: script.theme as Session["theme"],
    scene: script.scene,
    voice: request.voice,
    length: request.length,
    intention: request.intention.trim(),
    verseIds: segments.flatMap((s) => (s.verseId ? [s.verseId] : [])),
    segments: segments.filter((s) => s.lines.length > 0),
    createdAt: Date.now(),
    source: "claude",
    care: script.care || undefined,
  };
}
