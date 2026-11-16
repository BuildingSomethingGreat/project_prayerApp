import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { composeSession } from "../lib/api";
import { useApp } from "../lib/store";
import type { Mode } from "../lib/types";

const STEPS: Record<Mode, string[]> = {
  prayer: ["Listening…", "Opening the Word…", "Writing your prayer…", "Preparing the voice…"],
  warfare: ["Listening…", "Taking up the Word…", "Writing your battle prayer…", "Preparing the voice…"],
  vision: ["Listening…", "Opening the Word…", "Seeing it with you…", "Writing your story…", "Preparing the voice…"],
};
/** Long enough to take one slow breath, even when the writing comes back instantly. */
const MIN_MS = 4200;

export function Creating() {
  const [step, setStep] = useState(0);
  const steps = STEPS[useApp((s) => s.mode)];

  useEffect(() => {
    const { mode, intention, themeHint, voice, length, save, open } = useApp.getState();
    let cancelled = false;
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS[mode].length - 1)), mode === "prayer" ? 1500 : 2600);
    const pause = new Promise((resolve) => setTimeout(resolve, MIN_MS));

    void Promise.all([composeSession({ mode, intention, themeHint: mode === "prayer" ? themeHint : undefined, voice, length }), pause]).then(([session]) => {
      if (cancelled) return;
      save(session);
      useApp.setState({ intention: "", themeHint: undefined });
      open(session);
    });

    return () => {
      cancelled = true;
      clearInterval(ticker);
    };
  }, []);

  return (
    <Page className="creating">
      <div className="breath" aria-hidden>
        <i />
        <i />
        <i />
        <b />
      </div>

      <div className="creating__status" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45 }}>
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="creating__skeleton" aria-hidden>
        <div className="skeleton" style={{ width: "100%" }} />
        <div className="skeleton" style={{ width: "82%" }} />
        <div className="skeleton" style={{ width: "56%" }} />
      </div>
    </Page>
  );
}
