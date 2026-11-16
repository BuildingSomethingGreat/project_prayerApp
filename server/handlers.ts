import { composeLocally } from "../src/content/compose.ts";
import { THEME_BY_ID } from "../src/content/themes.ts";
import type { ComposeRequest, SessionLength, VoiceId } from "../src/lib/types.ts";
import { canCompose, composeWithClaude } from "./compose.ts";
import { canSpeak, speak, SpeechError } from "./speech.ts";

/**
 * The API, independent of how it is hosted. `server/index.ts` mounts these on
 * Express; `netlify/functions/api.mts` mounts them on a Netlify Function.
 */
export interface Reply {
  status: number;
  body: unknown;
}

const VOICES: VoiceId[] = ["naomi", "elodie", "gideon"];
const LENGTHS: SessionLength[] = ["short", "full"];

type Body = Record<string, unknown> | null | undefined;

export function health(): Reply {
  return { status: 200, body: { compose: canCompose(), speech: canSpeak() } };
}

export async function compose(body: Body): Promise<Reply> {
  const input = body ?? {};
  const request: ComposeRequest = {
    intention: String(input.intention ?? "").slice(0, 2000),
    themeHint: typeof input.themeHint === "string" && input.themeHint in THEME_BY_ID ? (input.themeHint as ComposeRequest["themeHint"]) : undefined,
    voice: VOICES.includes(input.voice as VoiceId) ? (input.voice as VoiceId) : "naomi",
    length: LENGTHS.includes(input.length as SessionLength) ? (input.length as SessionLength) : "short",
  };
  if (!canCompose()) return { status: 200, body: composeLocally(request) };
  try {
    return { status: 200, body: await composeWithClaude(request) };
  } catch (error) {
    // She should still get her moment; fall back to the on-device library.
    console.error("compose failed, using local library:", error instanceof Error ? error.message : error);
    return { status: 200, body: composeLocally(request) };
  }
}

export async function speech(body: Body): Promise<Reply> {
  if (!canSpeak()) return { status: 503, body: { error: "Voice synthesis is not configured." } };
  const lines: string[] = Array.isArray(body?.lines) ? body.lines.map(String).filter(Boolean).slice(0, 40) : [];
  const voice: VoiceId = VOICES.includes(body?.voice as VoiceId) ? (body?.voice as VoiceId) : "naomi";
  if (!lines.length || lines.join(" ").length > 4000) return { status: 400, body: { error: "Nothing to speak, or too much at once." } };
  try {
    return { status: 200, body: await speak(lines, voice) };
  } catch (error) {
    console.error("speak failed:", error instanceof Error ? error.message : error);
    const reason = error instanceof SpeechError ? `${error.status} ${error.reason}` : "unreachable";
    return { status: 502, body: { error: "The voice is unavailable right now.", reason } };
  }
}
