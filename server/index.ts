import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeLocally } from "../src/content/compose.ts";
import { THEME_BY_ID } from "../src/content/themes.ts";
import type { ComposeRequest, SessionLength, VoiceId } from "../src/lib/types.ts";
import { canCompose, composeWithClaude } from "./compose.ts";
import { canSpeak, speak } from "./speech.ts";

const PORT = Number(process.env.PORT ?? 8787);
const VOICES: VoiceId[] = ["naomi", "elodie", "gideon"];
const LENGTHS: SessionLength[] = ["short", "full"];

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

/** A small per-address budget so one client cannot run up the model and voice bills. */
const hits = new Map<string, { count: number; reset: number }>();
function limit(max: number, windowMs: number): express.RequestHandler {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      res.status(429).json({ error: "Too many requests. Take a breath and try again shortly." });
      return;
    }
    next();
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ compose: canCompose(), speech: canSpeak() });
});

app.post("/api/compose", limit(12, 10 * 60_000), async (req, res) => {
  const body = req.body ?? {};
  const request: ComposeRequest = {
    intention: String(body.intention ?? "").slice(0, 2000),
    themeHint: body.themeHint in THEME_BY_ID ? body.themeHint : undefined,
    voice: VOICES.includes(body.voice) ? body.voice : "naomi",
    length: LENGTHS.includes(body.length) ? body.length : "short",
  };
  if (!canCompose()) {
    res.json(composeLocally(request));
    return;
  }
  try {
    res.json(await composeWithClaude(request));
  } catch (error) {
    // She should still get her moment; fall back to the on-device library.
    console.error("compose failed, using local library:", error instanceof Error ? error.message : error);
    res.json(composeLocally(request));
  }
});

app.post("/api/speak", limit(120, 10 * 60_000), async (req, res) => {
  if (!canSpeak()) {
    res.status(503).json({ error: "Voice synthesis is not configured." });
    return;
  }
  const lines: string[] = Array.isArray(req.body?.lines) ? req.body.lines.map(String).filter(Boolean).slice(0, 40) : [];
  const voice: VoiceId = VOICES.includes(req.body?.voice) ? req.body.voice : "naomi";
  if (!lines.length || lines.join(" ").length > 4000) {
    res.status(400).json({ error: "Nothing to speak, or too much at once." });
    return;
  }
  try {
    res.json(await speak(lines, voice));
  } catch (error) {
    console.error("speak failed:", error instanceof Error ? error.message : error);
    res.status(502).json({ error: "The voice is unavailable right now." });
  }
});

// In production the same process serves the built app.
const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: "1h", index: "index.html" }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`Liora server on :${PORT} — writer: ${canCompose() ? "Claude" : "on-device library"}, voice: ${canSpeak() ? "ElevenLabs" : "device speech"}`);
});
