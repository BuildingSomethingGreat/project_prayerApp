import { composeLocally } from "../content/compose";
import type { Capabilities, ComposeRequest, SegmentKind, Session, VoiceId } from "./types";

export interface SpokenSegment {
  audio: string;
  starts: number[];
  duration: number;
}

const NONE: Capabilities = { compose: false, speech: false };
let capabilities: Promise<Capabilities> | undefined;

async function request<T>(path: string, init?: RequestInit, timeoutMs = 45_000): Promise<T> {
  const res = await fetch(path, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** What the server can do. With no server at all (static hosting, offline) everything runs on the device. */
export function getCapabilities(): Promise<Capabilities> {
  capabilities ??= request<Capabilities>("/api/health", undefined, 4000).catch(() => NONE);
  return capabilities;
}

export async function composeSession(req: ComposeRequest): Promise<Session> {
  const caps = await getCapabilities();
  if (!caps.compose) return composeLocally(req);
  try {
    return await request<Session>("/api/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    return composeLocally(req);
  }
}

async function digest(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const AUDIO_CACHE = "liora-voice-v3";

/**
 * Spoken audio for one segment. Kept in Cache Storage so a saved session
 * replays offline and is never synthesised (or billed) twice.
 */
export async function speakSegment(lines: string[], voice: VoiceId, context: { kind?: SegmentKind; before?: string; after?: string } = {}): Promise<SpokenSegment> {
  const key = `/voice-cache/${await digest(`${voice}\n${lines.join("\n")}`)}`;
  const cache = "caches" in window ? await caches.open(AUDIO_CACHE).catch(() => undefined) : undefined;
  const hit = await cache?.match(key);
  if (hit) return (await hit.json()) as SpokenSegment;

  const spoken = await request<SpokenSegment>("/api/speak", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lines, voice, ...context }),
  });
  await cache?.put(key, new Response(JSON.stringify(spoken), { headers: { "content-type": "application/json" } })).catch(() => {});
  return spoken;
}
