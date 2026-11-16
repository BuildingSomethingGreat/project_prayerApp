import { motion } from "framer-motion";
import { useEffect } from "react";
import { useApp } from "../lib/store";

const HOLD_MS = 3800;

/** A breath before anything is asked of her: the light fills the whole screen and the name settles into it. Tap to move on sooner. */
export function Splash() {
  const go = useApp((s) => s.go);
  const onboarded = useApp((s) => s.onboarded);
  const advance = () => go(onboarded ? "home" : "onboarding");

  useEffect(() => {
    const timer = setTimeout(advance, HOLD_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.main className="page splash" onClick={advance} exit={{ opacity: 0, y: -8, transition: { duration: 0.5 } }}>
      <motion.h1 className="splash__mark" initial={{ opacity: 0, letterSpacing: "0.3em", filter: "blur(8px)" }} animate={{ opacity: 1, letterSpacing: "0.01em", filter: "blur(0px)" }} transition={{ duration: 1.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        liora
      </motion.h1>
      <motion.p className="splash__line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 1.9 }}>
        a quiet place to pray
      </motion.p>
    </motion.main>
  );
}
