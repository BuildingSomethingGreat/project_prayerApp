# Architecture

## The shape of it

```
┌────────────────────────── Browser (PWA) ──────────────────────────┐
│                                                                   │
│  Screens ── zustand store ── Backdrop (never unmounts)            │
│     │                                                             │
│     ├─ Creating ──► api.composeSession ──┐                        │
│     │                                    │  falls back to         │
│     │                                    ▼  content/compose.ts    │
│     └─ Player ──► Engine ──► api.speakSegment ─┐                  │
│                     │                          │ falls back to    │
│                     └─► SoundBed (Web Audio)   ▼ speechSynthesis  │
│                                                                   │
│  Service worker: app shell precache · media cache · voice cache   │
└──────────────────────────────┬────────────────────────────────────┘
                               │ /api/*
┌──────────────────────────────▼────────────────────────────────────┐
│  server/index.ts (Express)                                        │
│    GET  /api/health   → { compose, speech }                       │
│    POST /api/compose  → Session        (Claude, or local library) │
│    POST /api/speak    → audio + line timings        (ElevenLabs)  │
│    static dist/                                                   │
└───────────────────────────────────────────────────────────────────┘
```

The guiding rule is that **she always gets her moment**. Every remote dependency has a local stand-in, and the client picks the best available at run time:

| Capability | Best | Stand-in |
| --- | --- | --- |
| Writing | Claude, via `/api/compose` | `composeLocally()` from the theme library, on device |
| Voice | ElevenLabs, via `/api/speak` | The browser's `speechSynthesis` |
| Voice, if the device has none | — | Silent timed reading; the lyrics still advance |

This also means the built app can be dropped on static hosting with no server and still work end to end.

## A session

A `Session` (see `src/lib/types.ts`) is a short album. Its `segments` are the tracks:

`Arrive → Scripture → Reflect → Pray → (Speak life → Scripture) → Go gently`

Each segment is a list of `lines`. A line is one spoken phrase, and is the unit of everything: it is one lyric on screen, one tap target for seeking, and one timing entry from the voice service. Keeping the line as the atom is what makes text and audio stay together without any alignment logic in the UI.

Sessions are saved to `localStorage` (through zustand's `persist`) and capped at 40. There are no accounts and no database.

## Scripture is data, never generated

This is the most important design decision in the codebase.

- `scripts/fetch_verses.mjs` pulls every passage from a public-domain translation into `src/content/verses.json`. Nothing in that file is typed by hand.
- The writing model receives the library in its system prompt and returns **verse ids**, constrained by a JSON schema enum. It cannot return a verse that is not in the library, and it is never asked to write one out.
- `scriptureSegment()` builds the scripture segment from the library text on the server (or on the device). The model contributes one sentence of lead-in.

So a misquoted or invented verse is not something to be caught in review; the system has no path that produces one. Details in [CONTENT.md](CONTENT.md).

## Writing (`server/compose.ts`)

One call to Claude with structured output (`messages.parse` and a Zod schema). The system prompt carries the voice, the theological guardrails and the verse library, and is marked for prompt caching since it is identical on every request. The request runs at low effort because she is watching a loader. If the call fails, is declined, or times out, the server returns a locally composed session instead; the client does the same if the server itself is unreachable.

The model also returns a `care` flag when what she wrote suggests she may be in danger. The local composer sets the same flag from a short list of phrases. The player then shows where to find help before the session begins and again at the end.

## Voice (`server/speech.ts`)

The server sends a segment's lines to ElevenLabs' timestamped endpoint, joined with short breaks, and reads each line's start time off the returned character alignment. The client gets `{ audio, starts, duration }` per segment.

The client stores each response in Cache Storage, keyed by a hash of voice and text (`api.speakSegment`). A saved session therefore replays offline and is never synthesised, or billed, twice.

Segment one is fetched before playback starts; the rest load in the background in order.

## The engine (`src/lib/engine.ts`)

One class owns playback. It keeps a single position, `(segment, offset in seconds)`, and lays every line out on a session-wide clock. Where narration has loaded it uses real timings; elsewhere it uses estimates and re-lays the timeline as audio arrives. The UI subscribes with `useSyncExternalStore` and only ever reads a snapshot: `{ status, line, seg, time, duration, mode }`.

Things worth knowing before changing it:

- **One `<audio>` element**, with its `src` swapped per segment. iOS only lets an element play without a fresh tap if that same element has played before.
- **The quiet between segments is real time.** `pauseAfter` is walked by a `requestAnimationFrame` clock, not baked into the audio, so it can be seeked through and tuned per segment.
- **Device speech is spoken one line at a time.** That gives exact line sync for free, and sidesteps browsers that cut off long utterances. Pause cancels and resume re-speaks the current line, because `speechSynthesis.pause()` is unreliable on Android.
- **Device speech has two safety nets.** A watchdog moves on if a device never reports that an utterance ended, and a line that "finishes" instantly (no voice installed) is held for its natural length.
- **If narration fails mid-session**, the engine switches to device speech at the current line rather than stopping.
- **Autoplay.** The player tries to begin on its own. If the browser refuses, the engine settles on `paused` and the play button is the way in.

## Backdrop and motion

`Backdrop` sits behind every screen and never unmounts, so navigating never flashes or reloads video. Scenes cross-fade when the store's `scene` changes, and an optional photograph (`photo` in the store) is multiplied into the light; see [STYLING.md](STYLING.md#photographs). The opener shows it edge to edge with only the wordmark over it, and the same element carries into the first page, so the opener and the app are one continuous shot.

The loops are made by `scripts/make_loops.py` from four gradient stills generated with Higgsfield. Each frame samples the still through a displacement field of sinusoids that complete a whole number of cycles over the clip, so the last frame flows into the first with no cut. Each loop is 20 seconds, 540×960, and about 400 KB.

`GlowField` is a second always-mounted layer above the backdrop: one WebGL canvas that draws the light behind the controls on every screen. The player tells it when the voice is sounding through `speaking` in the store.

Screens are swapped by `AnimatePresence` in `App.tsx` against a `screen` value in the store. There is no router: the flow is linear and the app has no shareable URLs yet.

## Offline and install

`vite-plugin-pwa` generates the service worker and manifest.

- The app shell (JS, CSS, HTML, fonts) is precached.
- The loops are fetched whole by `App.tsx` into the `liora-media` cache on first run. Workbox's range-request support then answers the `<video>` element's byte-range requests from that cache. (A `<video>` only ever asks for ranges, and partial responses cannot be cached, which is why the app fills the cache itself.)
- Photographs are cached on first view in `liora-photos`.
- Narration lives in `liora-voice-v1`, as above.

## Security and cost

- Keys live only on the server. The client never sees them.
- `/api/compose` and `/api/speak` have per-address rate limits and input size caps. Before a public launch these should move to a shared store and sit behind real accounts; see [VISION.md](VISION.md).
- What she writes is sent to the server only to compose the session, and is stored only on her device.

## Renaming the app

The name appears in: `index.html`, the manifest in `vite.config.ts`, the wordmark in `Splash.tsx`, `Onboarding.tsx` and `Home.tsx`, the system prompt in `server/compose.ts`, the persistence and cache keys (`liora`, `liora-media`, `liora-voice-v1`), and `package.json`. Changing the storage keys will orphan saved sessions, so rename those before launch or not at all.

## What has and has not been exercised

Verified in a headless browser at phone, tablet and desktop sizes: the whole flow from the opener to "Amen", local composition, device-voice playback, and the narration path against a mocked `/api/speak` (sync, seeking, pause, "Hear it", caching).

Run against the live services on the deployed site: Claude wrote a session from a real intention in about nine seconds, and ElevenLabs returned narration with line timings for all three voices. What has not been done is a full listen-through in a real browser on a real device, and the three voices are stock ElevenLabs voices chosen by description, not by ear (`server/speech.ts` tries a short list for each and keeps the first that the account has).
