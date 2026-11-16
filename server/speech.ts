import type { SegmentKind, VoiceId } from "../src/lib/types.ts";

/**
 * Voice synthesis through ElevenLabs. Each of Liora's three voices maps to an
 * ElevenLabs voice id, overridable per deployment.
 *
 * Each voice has an ordered list of candidates: the deployment's own choice
 * first, then stock voices that suit the character. Stock voices come and go
 * between accounts, so if one is not found the next is tried, and the one that
 * works is remembered. Audition and set your own before launch.
 */
const CANDIDATES: Record<VoiceId, string[]> = {
  naomi: [process.env.ELEVENLABS_VOICE_NAOMI, "XrExE9yKIg1WjnnlVkGX", "EXAVITQu4vr4xnSDxMaL", "cgSgspJ2msm6clMCkdW9", "pFZP5JQG7iQjIQuC4Bku"].filter((id): id is string => Boolean(id)),
  elodie: [process.env.ELEVENLABS_VOICE_ELODIE, "pFZP5JQG7iQjIQuC4Bku", "EXAVITQu4vr4xnSDxMaL"].filter((id): id is string => Boolean(id)),
  gideon: [process.env.ELEVENLABS_VOICE_GIDEON, "JBFqnCBsd6RMkjVDRZzb", "onwK4e9ZLuTAKqWW03F9"].filter((id): id is string => Boolean(id)),
};

/** The candidate that last worked for each voice, so a missing one is only discovered once. */
const working: Partial<Record<VoiceId, string>> = {};

/**
 * Speech models, most expressive first. Eleven v3 can be directed with short
 * bracketed cues ("[softly]") and speaks far more like a person in conversation;
 * the older model is the fallback if an account or voice cannot use it.
 */
const MODELS = process.env.ELEVENLABS_MODEL ? [process.env.ELEVENLABS_MODEL] : ["eleven_v3", "eleven_multilingual_v2"];
const directable = (model: string) => model.startsWith("eleven_v3");

/**
 * How each part of a session should be spoken. On a directable model these are
 * sent as cues ahead of the words; they are never shown or spoken.
 */
const DIRECTION: Record<SegmentKind, string> = {
  arrive: "[warmly] [softly, like a close friend sitting beside her]",
  scripture: "[gently] [with quiet reverence]",
  reflect: "[warmly] [thoughtful, conversational]",
  pray: "[softly] [tenderly, praying with a friend]",
  declare: "[warmly] [encouraging]",
  bless: "[softly] [smiling]",
};

/** Settings for the fallback model: lower stability lets pitch and pace move; a little style adds warmth. */
const DELIVERY = { stability: 0.4, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true, speed: 1.0 };

export interface SpokenSegment {
  /** Base64 MP3. */
  audio: string;
  /** The speech model that produced it. */
  model: string;
  /** Start time of each line within the audio, in seconds. */
  starts: number[];
  duration: number;
}

/**
 * A refusal from the voice service. `reason` is the service's own short status
 * word (for example "quota_exceeded" or "voice_not_found"): safe to show, and
 * enough to tell a bad key from a missing voice without reading server logs.
 */
export class SpeechError extends Error {
  readonly status: number;
  readonly reason: string;
  constructor(status: number, body: string) {
    let reason = "unknown";
    try {
      const detail = JSON.parse(body)?.detail;
      reason = String(detail?.status ?? detail?.code ?? (typeof detail === "string" ? detail : reason)).slice(0, 80);
      if (typeof detail?.message === "string") reason += `: ${detail.message.slice(0, 160)}`;
    } catch {
      // Not JSON; the status code alone will have to do.
    }
    super(`ElevenLabs ${status}: ${reason}`);
    this.status = status;
    this.reason = reason;
  }
}

export function canSpeak(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export interface SpeechContext {
  /** Which part of the session this is, to choose how it is spoken. */
  kind?: SegmentKind;
  /** What was said just before these lines, and what comes just after. Not spoken; it shapes the intonation. */
  before?: string;
  after?: string;
}

/** Whether a refusal is about this voice or this model (try the next), rather than the account (stop). */
const voiceMissing = (e: SpeechError) => e.reason.startsWith("voice_not_found");
const accountProblem = (e: SpeechError) => e.status === 401 || e.status === 402 || e.status === 429 || /quota|api_key|payment/.test(e.reason);

/** The model and voice that last worked, so fallbacks are only discovered once per warm server. */
let workingModel: string | undefined;

async function request(model: string, voiceId: string, text: string, context: SpeechContext): Promise<Response> {
  const body = directable(model)
    ? { text, model_id: model, voice_settings: { stability: 0.5 } }
    : {
        text,
        model_id: model,
        voice_settings: DELIVERY,
        // Lets the model match its tone to the neighbouring segments instead of starting cold each time.
        previous_text: context.before || undefined,
        next_text: context.after || undefined,
      };
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function speak(lines: string[], voice: VoiceId, context: SpeechContext = {}): Promise<SpokenSegment> {
  let refusal: SpeechError | undefined;

  for (const model of workingModel ? [workingModel] : MODELS) {
    // The lines are sent as one flowing passage, so the voice carries a thought
    // across them as a person speaking would. Record where each line begins, to
    // read its start time off the alignment.
    const offsets: number[] = [];
    let text = directable(model) && context.kind ? `${DIRECTION[context.kind]} ` : "";
    for (const [i, line] of lines.entries()) {
      if (i) text += " ";
      offsets.push(text.length);
      text += line;
    }

    let res: Response | undefined;
    for (const id of working[voice] ? [working[voice]] : CANDIDATES[voice]) {
      res = await request(model, id, text, context);
      if (res.ok) {
        working[voice] = id;
        break;
      }
      refusal = new SpeechError(res.status, await res.text());
      if (!voiceMissing(refusal)) break;
    }
    if (!res?.ok) {
      if (refusal && accountProblem(refusal)) throw refusal;
      console.warn(`speech model ${model} refused (${refusal?.message}); trying the next`);
      continue;
    }
    workingModel = model;

    const data = (await res.json()) as {
      audio_base64: string;
      alignment?: { characters?: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
    };
    const startTimes = data.alignment?.character_start_times_seconds ?? [];
    const endTimes = data.alignment?.character_end_times_seconds ?? [];
    const duration = endTimes.at(-1) ?? 0;

    // The alignment may or may not include the direction cues. Find where the
    // first line really begins in it, and measure every line from there.
    const spoken = (data.alignment?.characters ?? []).join("");
    const shift = spoken ? Math.max(0, spoken.indexOf(lines[0].slice(0, 12))) - offsets[0] : 0;

    // Without alignment, spread the lines by length — close enough to keep the lyrics moving.
    const starts = startTimes.length
      ? offsets.map((o) => startTimes[Math.max(0, Math.min(o + shift, startTimes.length - 1))])
      : offsets.map((o) => (o / Math.max(text.length, 1)) * duration);
    starts[0] = Math.min(starts[0], 0.4); // the cue itself takes no time worth showing

    return { audio: data.audio_base64, model, starts, duration };
  }
  throw refusal ?? new Error("No speech model is available.");
}
