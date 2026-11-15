import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { SceneId } from "../lib/types";

const OPEN = "inset(0% 0% 0% 0% round 0px)";
/** The rounded window of light the app opens on, before it grows to fill the screen. */
const ORB = "inset(23% 13% 23% 13% round 88px)";

function Scene({ scene }: { scene: SceneId }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const still = useReducedMotion();

  useEffect(() => {
    // Some browsers pause muted video when the tab is hidden and never resume it.
    const resume = () => document.visibilityState === "visible" && void video.current?.play().catch(() => {});
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);

  return (
    <motion.div className="backdrop__scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: "easeInOut" }}>
      <img src={`/media/${scene}.jpg`} alt="" />
      {!still && (
        <video
          ref={video}
          src={`/media/${scene}.mp4`}
          poster={`/media/${scene}.jpg`}
          data-ready={ready}
          onCanPlay={() => setReady(true)}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          aria-hidden
        />
      )}
    </motion.div>
  );
}

interface Props {
  scene: SceneId;
  /** Splash state: the light is held inside a rounded window. */
  orb: boolean;
  /** How strongly the scene is darkened so text stays readable, 0–1. */
  dim: number;
}

/** The looping light behind every screen. It never unmounts, so moving between screens never flashes. */
export function Backdrop({ scene, orb, dim }: Props) {
  return (
    <div className="backdrop" aria-hidden>
      <motion.div className="backdrop__glow" animate={{ opacity: orb ? [0.7, 1, 0.7] : 0, scale: orb ? [1, 1.05, 1] : 1.4 }} transition={orb ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : { duration: 1.2 }} />
      <motion.div className="backdrop__window" initial={false} animate={{ clipPath: orb ? ORB : OPEN, scale: orb ? [1, 1.025, 1] : 1 }} transition={orb ? { scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }, clipPath: { duration: 0 } } : { duration: 1.5, ease: [0.22, 1, 0.36, 1] }}>
        <AnimatePresence initial={false}>
          <Scene key={scene} scene={scene} />
        </AnimatePresence>
        <div className="backdrop__scrim" style={{ opacity: dim }} />
      </motion.div>
    </div>
  );
}
