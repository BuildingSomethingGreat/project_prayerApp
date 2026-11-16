import { useRef } from "react";
import { ChevronLeft } from "../components/Icons";
import { Page, Rise } from "../components/Page";
import { MODES, MODE_BY_ID } from "../content/modes";
import { PROMPT_CHIPS, THEME_BY_ID } from "../content/themes";
import { useApp } from "../lib/store";
import type { ThemeId } from "../lib/types";

const MAX = 2400;

export function Intention() {
  const intention = useApp((s) => s.intention);
  const themeHint = useApp((s) => s.themeHint);
  const hasHistory = useApp((s) => s.sessions.length > 0);
  const setIntention = useApp((s) => s.setIntention);
  const go = useApp((s) => s.go);
  const mode = useApp((s) => s.mode);
  const copy = MODE_BY_ID[mode];
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

  // A prayer can start from a chip alone; a vision needs something to see.
  const ready = mode === "prayer" ? intention.trim().length >= 3 || Boolean(themeHint) : mode === "warfare" ? true : intention.trim().length >= 10;

  const switchMode = (next: typeof mode) => {
    // A chip's starter sentence belongs to prayer; don't carry it into another kind of moment.
    const starter = PROMPT_CHIPS.some((chip) => THEME_BY_ID[chip].starter === intention);
    useApp.setState({ mode: next, ...(starter ? { intention: "", themeHint: undefined } : {}) });
  };

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

      <div className="split">
        <Rise className="split__lead">
          <div className="modes" role="radiogroup" aria-label="What kind of moment">
            {MODES.map((m) => (
              <button key={m.id} className="mode" role="radio" aria-checked={mode === m.id} onClick={() => switchMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <h1 className="display" key={mode}>
            {copy.lead}
            <span>{copy.rest}</span>
          </h1>
          <p className="lede">{copy.lede}</p>
        </Rise>

        <div className="split__body">
          <Rise delay={0.08} className="glass field">
            <label className="sr-only" htmlFor="intention">
              What's on your heart?
            </label>
            <textarea id="intention" ref={field} value={intention} maxLength={MAX} placeholder={copy.placeholder} onChange={(e) => setIntention(e.target.value)} />
            <small>Only used to write your prayer.</small>
          </Rise>

          {mode === "prayer" && (
            <Rise delay={0.16} className="chips">
              {PROMPT_CHIPS.map((id) => (
                <button key={id} className="chip" aria-pressed={themeHint === id} onClick={() => choose(id)}>
                  {THEME_BY_ID[id].label}
                </button>
              ))}
            </Rise>
          )}

          <div className="spacer" />
          <button className="btn" disabled={!ready} onClick={() => go("voice")}>
            Continue
          </button>
        </div>
      </div>
    </Page>
  );
}
