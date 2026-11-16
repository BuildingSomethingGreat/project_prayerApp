import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canCompose } from "./compose.ts";
import { compose, health, speech, type Reply } from "./handlers.ts";
import { canSpeak } from "./speech.ts";

const PORT = Number(process.env.PORT ?? 8787);

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

const send = (res: express.Response, reply: Reply) => void res.status(reply.status).json(reply.body);

app.get("/api/health", (_req, res) => send(res, health()));
app.post("/api/compose", limit(12, 10 * 60_000), async (req, res) => send(res, await compose(req.body)));
app.post("/api/speak", limit(120, 10 * 60_000), async (req, res) => send(res, await speech(req.body)));

// In production the same process serves the built app.
const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: "1h", index: "index.html" }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`Liora server on :${PORT} — writer: ${canCompose() ? "Claude" : "on-device library"}, voice: ${canSpeak() ? "ElevenLabs" : "device speech"}`);
});
