import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Page } from "../components/Page";
import { useApp } from "../lib/store";

const SLIDES = [
  { lead: "Prayer,", rest: "written for you.", body: "Share what's on your heart. Liora turns it into a guided moment of prayer, spoken just for you." },
  { lead: "Rooted", rest: "in Scripture.", body: "Every moment is built around God's Word. The verse is always one tap away." },
  { lead: "A quiet", rest: "place.", body: "No feeds. No noise. A calm voice, soft light, and room to breathe." },
];

export function Onboarding() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const go = useApp((s) => s.go);
  const finishOnboarding = useApp((s) => s.finishOnboarding);
  const last = index === SLIDES.length - 1;

  const begin = () => {
    finishOnboarding();
    go("intention");
  };
  const move = (step: number) => {
    const next = index + step;
    if (next < 0) return;
    if (next >= SLIDES.length) return begin();
    setDirection(step);
    setIndex(next);
  };

  const slide = SLIDES[index];
  return (
    <Page className="onboard">
      <header className="topbar">
        <span className="wordmark" style={{ paddingLeft: 10 }}>
          liora
        </span>
        <button className="link" onClick={begin}>
          Skip
        </button>
      </header>

      <div className="onboard__slides">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.section
            key={index}
            className="onboard__slide"
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 44 * d, filter: "blur(6px)" }),
              center: { opacity: 1, x: 0, filter: "blur(0px)" },
              exit: (d: number) => ({ opacity: 0, x: -44 * d, filter: "blur(6px)" }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -400) move(1);
              else if (info.offset.x > 60 || info.velocity.x > 400) move(-1);
            }}
          >
            <div className="onboard__number">{index + 1}</div>
            <h1 className="display">
              {slide.lead}
              <span>{slide.rest}</span>
            </h1>
            <p className="lede">{slide.body}</p>
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="dots" role="tablist" aria-label="Introduction">
        {SLIDES.map((_, i) => (
          <i key={i} data-on={i === index} role="tab" aria-selected={i === index} />
        ))}
      </div>
      <button className="btn" onClick={() => move(1)}>
        {last ? "Begin" : "Continue"}
      </button>
    </Page>
  );
}
