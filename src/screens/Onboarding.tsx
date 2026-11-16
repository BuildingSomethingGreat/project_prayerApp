import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import type { PhotoId } from "../content/photos";
import { useApp } from "../lib/store";

const SLIDES: { lead: string; rest: string; body: string; photo: PhotoId }[] = [
  { lead: "Prayer,", rest: "written for you.", body: "Share what's on your heart. Liora turns it into a guided moment of prayer, spoken just for you.", photo: "open-hands" },
  { lead: "Rooted", rest: "in Scripture.", body: "Every moment is built around God's Word. The verse is always one tap away.", photo: "scripture" },
  { lead: "A quiet", rest: "place.", body: "No feeds. No noise. A calm voice, soft light, and room to breathe.", photo: "quiet-place" },
];

export function Onboarding() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const go = useApp((s) => s.go);
  const setPhoto = useApp((s) => s.setPhoto);
  const finishOnboarding = useApp((s) => s.finishOnboarding);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  // Each idea has its own photograph, laid into the light behind the words.
  useEffect(() => setPhoto(slide.photo), [slide.photo, setPhoto]);

  const begin = () => {
    finishOnboarding();
    go("intention");
  };
  const show = (next: number) => {
    if (next < 0 || next === index) return;
    if (next >= SLIDES.length) return begin();
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "ArrowLeft") show(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
              if (info.offset.x < -60 || info.velocity.x < -400) show(index + 1);
              else if (info.offset.x > 60 || info.velocity.x > 400) show(index - 1);
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

      <footer className="onboard__foot">
        <div className="dots" role="tablist" aria-label="Introduction">
          {SLIDES.map((s, i) => (
            <button key={i} role="tab" aria-selected={i === index} aria-label={`${s.lead} ${s.rest}`} onClick={() => show(i)} />
          ))}
        </div>
        <button className="btn" onClick={() => show(index + 1)}>
          {last ? "Begin" : "Continue"}
        </button>
      </footer>
    </Page>
  );
}
