import type { VoiceId } from "../src/lib/types.ts";

/**
 * Voice synthesis through ElevenLabs. Each of Liora's three voices maps to an
 * ElevenLabs voice id, overridable per deployment.
 *
 * The defaults are ElevenLabs stock voices chosen to match each character
 * (warm / soft / deep). Audition and replace them before launch.
 */
const VOICES: Record<VoiceId, string> = {
  naomi: process.env.ELEVENLABS_VOICE_NAOMI ?? "XB0fDUnXU8jAwrOEA2Bg",
  elodie: process.env.ELEVENLABS_VOICE_ELODIE ?? "pFZP5JQG7iQjIQuC4Bku",
  gideon: process.env.ELEVENLABS_VOICE_GIDEON ?? "JBFqnCBsd6RMkjVDRZzb",
};

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

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[voice]}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.62, similarity_boost: 0.78, style: 0.08, speed: 0.9 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);

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
