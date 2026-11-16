import { compose, health, speech, type Reply } from "../../server/handlers.ts";

/**
 * The whole API as one Netlify Function. Keys are read from the site's
 * environment variables (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY); with neither
 * set, the app still works from its on-device library and voice.
 */
export const config = { path: "/api/*" };

const json = (reply: Reply) => Response.json(reply.body, { status: reply.status, headers: { "cache-control": "no-store" } });

export default async function handler(request: Request): Promise<Response> {
  const route = new URL(request.url).pathname.replace(/^\/api\//, "");

  if (route === "health" && request.method === "GET") return json(health());
  if (request.method !== "POST") return json({ status: 405, body: { error: "Method not allowed." } });

  const text = await request.text();
  if (text.length > 64_000) return json({ status: 413, body: { error: "Too much at once." } });
  let body: Record<string, unknown> | null = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    return json({ status: 400, body: { error: "That was not valid JSON." } });
  }

  if (route === "compose") return json(await compose(body));
  if (route === "speak") return json(await speech(body));
  return json({ status: 404, body: { error: "Not found." } });
}
