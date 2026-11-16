import type { VoiceId } from "../src/lib/types.ts";

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

const MODEL = process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
/** A breath between phrases so the pacing stays meditative. */
const BREAK = ' <break time="0.7s" /> ';

export interface SpokenSegment {
  /** Base64 MP3. */
  audio: string;
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

export async function speak(lines: string[], voice: VoiceId): Promise<SpokenSegment> {
  // Record where each line begins in the joined text, to read its start time off the alignment.
  const offsets: number[] = [];
  let text = "";
  for (const line of lines) {
    if (text) text += BREAK;
    offsets.push(text.length);
    text += line;
  }

  const candidates = working[voice] ? [working[voice]] : CANDIDATES[voice];
  let res: Response | undefined;
  let refusal: SpeechError | undefined;
  for (const id of candidates) {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "", "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.62, similarity_boost: 0.78, style: 0.08, speed: 0.9 },
      }),
    });
    if (res.ok) {
      working[voice] = id;
      break;
    }
    refusal = new SpeechError(res.status, await res.text());
    // Only a missing voice is worth trying the next candidate for; anything else would fail the same way.
    if (refusal.reason !== "voice_not_found") throw refusal;
  }
  if (!res?.ok) throw refusal ?? new Error("No voice is configured.");

  const data = (await res.json()) as {
    audio_base64: string;
    alignment?: { character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };
  const startTimes = data.alignment?.character_start_times_seconds ?? [];
  const endTimes = data.alignment?.character_end_times_seconds ?? [];
  const duration = endTimes.at(-1) ?? 0;

  // Without alignment, spread the lines by length — close enough to keep the lyrics moving.
  const starts = startTimes.length
    ? offsets.map((o) => startTimes[Math.min(o, startTimes.length - 1)])
    : offsets.map((o) => (o / Math.max(text.length, 1)) * duration);

  return { audio: data.audio_base64, starts, duration };
}
