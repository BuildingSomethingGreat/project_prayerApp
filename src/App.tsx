import { AnimatePresence, MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { Backdrop } from "./components/Backdrop";
import { GlowField } from "./components/GlowField";
import { getCapabilities } from "./lib/api";
import { useApp, type Screen } from "./lib/store";
import { Creating } from "./screens/Creating";
import { Home } from "./screens/Home";
import { Intention } from "./screens/Intention";
import { Onboarding } from "./screens/Onboarding";
import { Player } from "./screens/Player";
import { Splash } from "./screens/Splash";
import { Voice } from "./screens/Voice";

const SCREENS: Record<Screen, () => React.JSX.Element | null> = {
  splash: Splash,
  onboarding: Onboarding,
  home: Home,
  intention: Intention,
  voice: Voice,
  creating: Creating,
  player: Player,
};

/** How much each screen darkens the light behind it. Reading screens need more; the opener needs least. */
const DIM: Record<Screen, number> = {
  splash: 0.3,
  onboarding: 0.3,
  home: 0.95,
  intention: 0.95,
  voice: 0.95,
  creating: 0.7,
  // The photograph is already multiplied dark; a lighter veil keeps its subject readable.
  player: 0.66,
};

/** How bright the drifting light behind the controls is on each screen. */
const GLOW: Record<Screen, number> = {
  splash: 0.3,
  onboarding: 0.4,
  home: 0.45,
  intention: 0.45,
  voice: 0.45,
  creating: 0.7,
  // In the player the light belongs to the orb; keep the pool underneath quiet.
  player: 0.3,
};

const MEDIA = ["dawn", "ember", "honey", "dusk"].flatMap((scene) => [`/media/${scene}.mp4`, `/media/${scene}.jpg`]);

export default function App() {
  const screen = useApp((s) => s.screen);
  const scene = useApp((s) => s.scene);
  const photo = useApp((s) => s.photo);
  const speaking = useApp((s) => s.speaking);
  const reading = useApp((s) => s.reading);
  // Over a photograph the veil does most of the work; the words need a little more.
  const dim = screen === "player" ? (reading ? 0.62 : 0.12) : DIM[screen];
  const Current = SCREENS[screen];

  useEffect(() => {
    void getCapabilities();
    // Fetch the loops whole, once, so the service worker can serve them offline
    // (a <video> only ever asks for byte ranges, which cannot be cached).
    if ("caches" in window) {
      void caches
        .open("liora-media")
        .then(async (cache) => {
          for (const url of MEDIA) if (!(await cache.match(url))) await cache.add(url);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Backdrop scene={scene} photo={photo} dim={dim} />
        <GlowField scene={scene} level={GLOW[screen]} lively={speaking} />
        <div className="stage">
          <AnimatePresence mode="wait" initial={false}>
            <Current key={screen} />
          </AnimatePresence>
        </div>
        <div className="grain" aria-hidden />
      </div>
    </MotionConfig>
  );
}
