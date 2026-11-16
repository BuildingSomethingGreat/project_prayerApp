import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useApp } from "../lib/store";
import { Glow } from "./Glow";

const EASE = [0.22, 1, 0.36, 1] as const;

/** A full screen that drifts in from the direction of travel and softens out. */
export function Page({ className = "", children, onClick, glow = true }: { className?: string; children: ReactNode; onClick?: () => void; glow?: boolean }) {
  const direction = useApp((s) => s.direction);
  return (
    <motion.main
      className={`page ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 18 * direction, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } }}
      exit={{ opacity: 0, y: -10 * direction, filter: "blur(6px)", transition: { duration: 0.28, ease: "easeIn" } }}
    >
      {glow && <Glow soft />}
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
