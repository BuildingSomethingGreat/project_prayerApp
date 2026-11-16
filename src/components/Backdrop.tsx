import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PHOTO_FOCUS, photoUrl, type PhotoId } from "../content/photos";
import type { SceneId } from "../lib/types";

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

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
      {!still && <video ref={video} src={`/media/${scene}.mp4`} poster={`/media/${scene}.jpg`} data-ready={ready} onCanPlay={() => setReady(true)} autoPlay loop muted playsInline disablePictureInPicture aria-hidden />}
    </motion.div>
  );
}

interface Props {
  scene: SceneId;
  /** A photograph multiplied into the light, so it takes on the scene's colour and movement. */
  photo: PhotoId | null;
  /** Splash state: the light is held inside a rounded window. */
  orb: boolean;
  /** How strongly the scene is darkened so text stays readable, 0–1. */
  dim: number;
}

/** The looping light behind every screen. It never unmounts, so moving between screens never flashes. */
export function Backdrop({ scene, photo, orb, dim }: Props) {
  const { w, h } = useViewport();

  // The splash window is a tall rounded shape sized to the shorter side, so it
  // is the same object on a phone and on a wide desktop.
  const orbW = Math.min(w * 0.74, h * 0.46, 430);
  const orbH = Math.min(orbW * 1.3, h * 0.66);
  const x = (w - orbW) / 2;
  const y = (h - orbH) / 2;
  const radius = orbW * 0.31;
  const frame = { left: x, top: y, width: orbW, height: orbH, borderRadius: radius };
  // The window itself changes shape (rather than being clipped), so the whole
  // composition of the scene is visible inside it at any size.
  const shape = orb ? frame : { left: 0, top: 0, width: w, height: h, borderRadius: 0 };

  return (
    <div className="backdrop" aria-hidden>
      <motion.div className="backdrop__glow" style={frame} animate={{ opacity: orb ? [0.65, 1, 0.65] : 0, scale: orb ? [1, 1.06, 1] : 1.5 }} transition={orb ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : { duration: 1.2 }} />
      <motion.div className="backdrop__window" initial={false} animate={{ ...shape, scale: orb ? [1, 1.02, 1] : 1 }} transition={orb ? { scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }, default: { duration: 0 } } : { duration: 1.5, ease: [0.22, 1, 0.36, 1] }}>
        <AnimatePresence initial={false}>
          <Scene key={scene} scene={scene} />
        </AnimatePresence>
        <AnimatePresence>
          {photo && (
            <motion.img key={photo} className="backdrop__photo" src={photoUrl(photo)} style={{ objectPosition: PHOTO_FOCUS[photo] }} alt="" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1.02 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 1.6, ease: "easeInOut" }, scale: { duration: 14, ease: "easeOut" } }} />
          )}
        </AnimatePresence>
        <div className="backdrop__scrim" style={{ opacity: dim }} />
        {/* The frosted inner edge of the splash window. */}
        <motion.div className="backdrop__rim" animate={{ opacity: orb ? 1 : 0 }} transition={{ duration: 0.6 }} />
      </motion.div>
    </div>
  );
}
