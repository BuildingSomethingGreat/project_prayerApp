import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PHOTO_FOCUS, photoUrl, type PhotoId } from "../content/photos";
import type { SceneId } from "../lib/types";

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
  /** A photograph shown in its own colours over the light. */
  photo: PhotoId | null;
  /** How strongly the scene is darkened so text stays readable, 0–1. */
  dim: number;
}

/** The looping light behind every screen, edge to edge. It never unmounts, so moving between screens never flashes. */
export function Backdrop({ scene, photo, dim }: Props) {
  return (
    <div className="backdrop" aria-hidden>
      {/* On first load the light rises out of the dark and settles, rather than snapping on. */}
      <motion.div className="backdrop__window" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ opacity: { duration: 1.8, ease: "easeOut" }, scale: { duration: 4.5, ease: [0.22, 1, 0.36, 1] } }}>
        <AnimatePresence initial={false}>
          <Scene key={scene} scene={scene} />
        </AnimatePresence>
        <AnimatePresence>
          {photo && (
            <motion.img key={photo} className="backdrop__photo" src={photoUrl(photo)} style={{ objectPosition: PHOTO_FOCUS[photo] }} alt="" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1.02 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 1.6, ease: "easeInOut" }, scale: { duration: 14, ease: "easeOut" } }} />
          )}
        </AnimatePresence>
        {/* Over a photograph: darkness at the edges falling away to nothing, with the far edges softened, so the picture stands out. */}
        <div className="backdrop__veil" data-on={Boolean(photo)}>
          <i />
          <i />
        </div>
        <div className="backdrop__scrim" data-photo={Boolean(photo)} style={{ opacity: dim }} />
      </motion.div>
    </div>
  );
}
