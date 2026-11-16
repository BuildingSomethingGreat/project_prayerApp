import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Play } from "../components/Icons";
import { Page, Rise } from "../components/Page";
import { useApp } from "../lib/store";
import { VOICES } from "../content/voices";
import type { SessionLength, VoiceId } from "../lib/types";

const LENGTHS: { id: SessionLength; label: string }[] = [
  { id: "short", label: "A few minutes" },
  { id: "full", label: "Unhurried" },
];

export function Voice() {
  const voice = useApp((s) => s.voice);
  const length = useApp((s) => s.length);
  const setVoice = useApp((s) => s.setVoice);
  const setLength = useApp((s) => s.setLength);
  const go = useApp((s) => s.go);

  const audio = useRef<HTMLAudioElement | null>(null);
  const [sample, setSample] = useState<{ id: VoiceId; state: "loading" | "playing" } | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  // Choosing a voice lets her hear it; tapping the one that is speaking quiets it.
  const choose = (id: VoiceId) => {
    setVoice(id);
    const player = (audio.current ??= new Audio());
    if (sample?.id === id) {
      player.pause();
      setSample(null);
      return;
    }
    player.src = `/media/voices/${id}.mp3`;
    player.onplaying = () => setSample({ id, state: "playing" });
    player.onended = player.onerror = () => setSample(null);
    setSample({ id, state: "loading" });
    void player.play().catch(() => setSample(null));
  };

  const create = () => {
    audio.current?.pause();
    go("creating");
  };

  return (
    <Page>
      <header className="topbar">
        <button className="icon-btn" onClick={() => go("intention", -1)} aria-label="Back">
          <ChevronLeft />
        </button>
      </header>

      <div className="split">
        <Rise className="split__lead">
          <h1 className="display">
            Choose
            <span>a voice.</span>
          </h1>
          <p className="lede wide-only">Tap a voice to hear it. You can choose a different one next time.</p>
        </Rise>

        <div className="split__body">
          <Rise delay={0.08}>
            <div role="radiogroup" aria-label="Voice" className="voices">
              {VOICES.map((v) => (
                <button key={v.id} className="glass voice" role="radio" aria-checked={voice === v.id} onClick={() => choose(v.id)}>
                  <span className="voice__orb">
                    <img src={`/media/${v.art}.jpg`} alt="" />
                    {sample?.id === v.id ? (
                      sample.state === "loading" ? (
                        <span className="spinner" />
                      ) : (
                        <span className="bars">
                          <i />
                          <i />
                          <i />
                        </span>
                      )
                    ) : (
                      <Play size={20} />
                    )}
                  </span>
                  <span className="voice__text">
                    <strong>{v.name}</strong>
                    <span>{v.tone}</span>
                  </span>
                  <span className="voice__check">{voice === v.id && <Check />}</span>
                </button>
              ))}
            </div>
          </Rise>

          <Rise delay={0.16}>
            <div className="glass segmented" role="radiogroup" aria-label="Length">
              <motion.span className="segmented__thumb" animate={{ x: length === "short" ? "0%" : "100%" }} transition={{ type: "spring", stiffness: 420, damping: 38 }} />
              {LENGTHS.map((l) => (
                <button key={l.id} role="radio" aria-checked={length === l.id} onClick={() => setLength(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
          </Rise>

          <div className="spacer" />
          <button className="btn" onClick={create}>
            Create my moment
          </button>
        </div>
      </div>
    </Page>
  );
}
