import { useRef } from "react";
import { ChevronLeft } from "../components/Icons";
import { Page, Rise } from "../components/Page";
import { PROMPT_CHIPS, THEME_BY_ID } from "../content/themes";
import { useApp } from "../lib/store";
import type { ThemeId } from "../lib/types";

const MAX = 1200;

export function Intention() {
  const intention = useApp((s) => s.intention);
  const themeHint = useApp((s) => s.themeHint);
  const hasHistory = useApp((s) => s.sessions.length > 0);
  const setIntention = useApp((s) => s.setIntention);
  const go = useApp((s) => s.go);
  const field = useRef<HTMLTextAreaElement>(null);

  // A chip is a way in, not a category: it starts the sentence and leaves the rest to her.
  const choose = (id: ThemeId) => {
    const starter = THEME_BY_ID[id].starter;
    const untouched = !intention.trim() || PROMPT_CHIPS.some((chip) => THEME_BY_ID[chip].starter === intention);
    useApp.setState({ themeHint: id, intention: untouched ? starter : intention });
    requestAnimationFrame(() => {
      const el = field.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const ready = intention.trim().length >= 3 || Boolean(themeHint);

  return (
    <Page>
      <header className="topbar">
        {hasHistory ? (
          <button className="icon-btn" onClick={() => go("home", -1)} aria-label="Back">
            <ChevronLeft />
          </button>
        ) : (
          <span className="topbar__spacer" />
        )}
      </header>

      <div className="form">
        <Rise>
          <h1 className="display">
            What's on
            <span>your heart?</span>
          </h1>
        </Rise>

        <Rise delay={0.08} className="glass field">
          <label className="sr-only" htmlFor="intention">
            What's on your heart?
          </label>
          <textarea id="intention" ref={field} value={intention} maxLength={MAX} placeholder="A worry, a dream, a name, a thank-you…" onChange={(e) => setIntention(e.target.value)} />
          <small>Only used to write your prayer.</small>
        </Rise>

        <Rise delay={0.16} className="chips">
          {PROMPT_CHIPS.map((id) => (
            <button key={id} className="chip" aria-pressed={themeHint === id} onClick={() => choose(id)}>
              {THEME_BY_ID[id].label}
            </button>
          ))}
        </Rise>

        <div className="spacer" />
        <button className="btn" disabled={!ready} onClick={() => go("voice")}>
          Continue
        </button>
      </div>
    </Page>
  );
}
