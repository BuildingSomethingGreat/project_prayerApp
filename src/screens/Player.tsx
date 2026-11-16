import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Book, ChevronDown, Next, Pause, Play, Prev, Waves } from "../components/Icons";
import { ScriptureSheet } from "../components/ScriptureSheet";
import { sessionVerses } from "../content/compose";
import { getCapabilities } from "../lib/api";
import { Engine } from "../lib/engine";
import { Music } from "../lib/music";
import { useApp } from "../lib/store";
import type { Session } from "../lib/types";
import { VOICES } from "../content/voices";

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Waits to learn whether studio narration is available before building the engine. */
export function Player() {
  const session = useApp((s) => s.current);
  const [narration, setNarration] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    void getCapabilities().then((caps) => live && setNarration(caps.speech));
    return () => {
      live = false;
    };
  }, []);

  if (!session) return null;
  return (
    <motion.main className="page player" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      {narration === null ? (
        <div style={{ margin: "auto" }}>
          <span className="spinner" role="status" aria-label="Loading" />
        </div>
      ) : (
        <Stage key={session.id} session={session} narration={narration} />
      )}
    </motion.main>
  );
}

function Stage({ session, narration }: { session: Session; narration: boolean }) {
  const go = useApp((s) => s.go);
  const soundBed = useApp((s) => s.soundBed);
  const setSoundBed = useApp((s) => s.setSoundBed);
  const hasHome = useApp((s) => s.onboarded);

  const engine = useMemo(() => new Engine(session, narration), [session, narration]);
  const bed = useMemo(() => new Music(session.scene), [session.scene]);
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const [sheet, setSheet] = useState(false);
  const [careSeen, setCareSeen] = useState(false);

  const lyrics = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLButtonElement>(null);
  const verses = useMemo(() => sessionVerses(session), [session]);
  const narrator = VOICES.find((v) => v.id === session.voice)?.name;

  useEffect(
    () => () => {
      engine.destroy();
      bed.destroy();
    },
    [engine, bed],
  );

  // Begin as soon as the first words are ready. If the browser refuses to
  // start sound on its own, the engine settles on "paused" and she presses play.
  const started = useRef(false);
  useEffect(() => {
    if (state.status === "ready" && !started.current) {
      started.current = true;
      void engine.play();
    }
  }, [state.status, engine]);

  const sounding = state.status === "playing" || state.status === "buffering";
  // Let the light behind the controls know the voice is sounding.
  useEffect(() => {
    useApp.setState({ speaking: sounding });
    return () => {
      useApp.setState({ speaking: false });
    };
  }, [sounding]);

  useEffect(() => {
    if (sounding && soundBed) bed.start();
    else bed.stop();
  }, [sounding, soundBed, bed]);

  // Keep the line being spoken a little above the middle of the screen.
  useEffect(() => {
    const box = lyrics.current;
    const el = active.current;
    if (!box || !el) return;
    box.scrollTo({ top: el.offsetTop - box.clientHeight * 0.34, behavior: "smooth" });
  }, [state.line]);

  // Lock-screen and headphone controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: session.title,
      artist: `Liora · ${narrator ?? ""}`,
      album: session.subtitle,
      artwork: [{ src: `/media/${session.scene}.jpg`, sizes: "540x960", type: "image/jpeg" }],
    });
    const handlers: [MediaSessionAction, () => void][] = [
      ["play", () => void engine.play()],
      ["pause", () => engine.pause()],
      ["previoustrack", () => engine.prevSegment()],
      ["nexttrack", () => engine.nextSegment()],
    ];
    for (const [action, handler] of handlers) navigator.mediaSession.setActionHandler(action, handler);
    return () => {
      for (const [action] of handlers) navigator.mediaSession.setActionHandler(action, null);
    };
  }, [engine, session, narrator]);

  // Desktop: the keyboard drives the player.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target instanceof HTMLInputElement) return;
      const snap = engine.getSnapshot();
      if (e.key === " ") engine.toggle();
      else if (e.key === "ArrowRight") engine.seekLine(snap.line + 1);
      else if (e.key === "ArrowLeft") engine.seekLine(snap.line - 1);
      else if (e.key === "ArrowDown") engine.nextSegment();
      else if (e.key === "ArrowUp") engine.prevSegment();
      else if (e.key === "Escape") setSheet(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine]);

  const close = () => go(hasHome ? "home" : "intention", -1);
  const fill = `${state.duration ? (state.time / state.duration) * 100 : 0}%`;
  const waiting = state.status === "loading" || state.status === "buffering";
  const readBy = state.mode === "voice" ? `Read by ${narrator}` : "Read by your device's voice";

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={close} aria-label="Close">
          <ChevronDown />
        </button>
        <div className="player__heading">
          <strong>{session.title}</strong>
          <span>{session.subtitle}</span>
        </div>
        <button className="icon-btn" onClick={() => setSheet(true)} aria-label="Read the Scripture">
          <Book />
        </button>
      </header>

      <div className="player__body">
        <aside className="player__side">
          <span className="eyebrow">In this moment</span>
          <nav className="tracks" aria-label="Parts of this moment">
            {session.segments.map((segment, seg) => (
              <button key={seg} className="track" aria-current={seg === state.seg} onClick={() => engine.seekSegment(seg)}>
                <small>{String(seg + 1).padStart(2, "0")}</small>
                {segment.title}
              </button>
            ))}
          </nav>
        </aside>

        <div className="lyrics" ref={lyrics}>
          <div className="lyrics__inner">
            {session.segments.map((segment, seg) => {
              const span = engine.spans[seg];
              return (
                <Fragment key={seg}>
                  <p className="eyebrow lyrics__label">{segment.title}</p>
                  {segment.lines.map((text, i) => {
                    const index = span.first + i;
                    const line = engine.lines[index];
                    const now = index === state.line;
                    return (
                      <button
                        key={index}
                        ref={now ? active : undefined}
                        className={`lyric${line.verse ? " scripture" : ""}`}
                        data-state={now ? "now" : index < state.line ? "past" : "next"}
                        aria-current={now}
                        onClick={() => engine.seekLine(index)}
                      >
                        {text}
                      </button>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>

        <aside className="player__side">
          <p className="mode-note" style={{ textAlign: "left" }}>
            {readBy}
          </p>
          <div className="keys">
            <span>
              <kbd>Space</kbd>Play or pause
            </span>
            <span>
              <kbd>←</kbd>
              <kbd>→</kbd>Previous or next line
            </span>
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd>Previous or next part
            </span>
          </div>
        </aside>
      </div>

      <footer className="player__dock">
        <div className="scrub">
          <input
            type="range"
            min={0}
            max={Math.max(state.duration, 1)}
            step={0.1}
            value={state.time}
            style={{ "--fill": fill } as React.CSSProperties}
            aria-label="Position"
            aria-valuetext={`${clock(state.time)} of ${clock(state.duration)}`}
            onChange={(e) => engine.seekTime(Number(e.target.value))}
          />
          <div className="scrub__times">
            <span>{clock(state.time)}</span>
            <span>{clock(state.duration)}</span>
          </div>
        </div>

        <div className="transport">
          <button className="icon-btn" aria-pressed={soundBed} aria-label="Background music" title="Background music" onClick={() => setSoundBed(!soundBed)}>
            <Waves />
          </button>
          <button className="icon-btn" onClick={() => engine.prevSegment()} aria-label="Previous part">
            <Prev />
          </button>
          <button className="transport__play" onClick={() => engine.toggle()} aria-label={sounding ? "Pause" : "Play"} aria-busy={waiting}>
            {waiting ? <span className="spinner" /> : sounding ? <Pause /> : <Play />}
          </button>
          <button className="icon-btn" onClick={() => engine.nextSegment()} aria-label="Next part">
            <Next />
          </button>
          <button className="icon-btn" onClick={() => setSheet(true)} aria-label="Read the Scripture">
            <Book />
          </button>
        </div>

        <p className="mode-note">{readBy}</p>
      </footer>

      <AnimatePresence>
        {session.care && !careSeen && state.status !== "ended" && (
          <motion.aside key="care" className="amen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CareNote />
            <div className="amen__actions">
              <button className="btn" onClick={() => setCareSeen(true)}>
                Continue to prayer
              </button>
            </div>
          </motion.aside>
        )}

        {state.status === "ended" && (
          <motion.aside key="amen" className="amen" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 1.2 } }} exit={{ opacity: 0 }}>
            <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 1 } }}>
              Amen.
            </motion.h2>
            {verses[0] && (
              <p className="lede">
                Carry <span className="scripture">{verses[0].ref}</span> with you today.
              </p>
            )}
            {session.care && <CareNote />}
            <div className="amen__actions">
              <button className="btn" onClick={close}>
                Done
              </button>
              <button className="btn btn--quiet" onClick={() => void engine.play()}>
                Listen again
              </button>
            </div>
          </motion.aside>
        )}

        {sheet && (
          <ScriptureSheet
            key="sheet"
            verses={verses}
            onClose={() => setSheet(false)}
            onHear={(verseId) => {
              const seg = session.segments.findIndex((s) => s.verseId === verseId);
              if (seg >= 0) engine.seekSegment(seg);
              setSheet(false);
              void engine.play();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Shown when what she wrote suggests she may be in danger. Prayer is not a substitute for a person. */
function CareNote() {
  return (
    <p className="glass care">
      <strong>You don't have to carry this alone.</strong> If you're in danger or thinking about harming yourself, please reach out to someone now. In the US, call or text <strong>988</strong>.
      Elsewhere, contact your local emergency number or someone you trust.
    </p>
  );
}
