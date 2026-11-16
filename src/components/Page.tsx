import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useApp } from "../lib/store";

const EASE = [0.22, 1, 0.36, 1] as const;

/** A full screen that drifts in from the direction of travel and fades out. Only opacity and position move, which stay smooth over blurred glass. */
export function Page({ className = "", children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  const direction = useApp((s) => s.direction);
  // Coming from the splash, wait for its window of light to finish opening before the words arrive.
  const delay = useApp((s) => (s.previous === "splash" ? 0.85 : 0));
  return (
    <motion.main
      className={`page ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 * direction }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } }}
      exit={{ opacity: 0, y: -8 * direction, transition: { duration: 0.26, ease: "easeIn" } }}
    >
      {children}
    </motion.main>
  );
}

/** Children rise in one after another. */
export function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}
