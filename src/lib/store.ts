import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PhotoId } from "../content/photos";
import type { SceneId, Session, SessionLength, ThemeId, VoiceId } from "./types";

export type Screen = "splash" | "onboarding" | "home" | "intention" | "voice" | "creating" | "player";

interface AppState {
  // Persisted
  onboarded: boolean;
  voice: VoiceId;
  length: SessionLength;
  soundBed: boolean;
  sessions: Session[];

  // In memory
  screen: Screen;
  /** Direction of the last move, so pages slide the way she expects. */
  direction: 1 | -1;
  scene: SceneId;
  /** A photograph laid into the light behind the screen, or none. */
  photo: PhotoId | null;
  intention: string;
  themeHint?: ThemeId;
  current?: Session;

  go: (screen: Screen, direction?: 1 | -1) => void;
  setScene: (scene: SceneId) => void;
  setPhoto: (photo: PhotoId | null) => void;
  setIntention: (intention: string, themeHint?: ThemeId) => void;
  setVoice: (voice: VoiceId) => void;
  setLength: (length: SessionLength) => void;
  setSoundBed: (on: boolean) => void;
  finishOnboarding: () => void;
  open: (session: Session) => void;
  save: (session: Session) => void;
  remove: (id: string) => void;
}

const SCENE_FOR: Partial<Record<Screen, SceneId>> = {
  splash: "dawn",
  onboarding: "dawn",
  home: "dawn",
  intention: "dusk",
  voice: "ember",
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      voice: "naomi",
      length: "short",
      soundBed: true,
      sessions: [],

      screen: "splash",
      direction: 1,
      scene: "dawn",
      photo: null,
      intention: "",

      go: (screen, direction = 1) => set((s) => ({ screen, direction, scene: SCENE_FOR[screen] ?? s.scene, photo: null })),
      setScene: (scene) => set({ scene }),
      setPhoto: (photo) => set({ photo }),
      setIntention: (intention, themeHint) => set((s) => ({ intention, themeHint: themeHint ?? s.themeHint })),
      setVoice: (voice) => set({ voice }),
      setLength: (length) => set({ length }),
      setSoundBed: (soundBed) => set({ soundBed }),
      finishOnboarding: () => set({ onboarded: true }),
      open: (session) => set({ current: session, scene: session.scene, photo: session.theme, screen: "player", direction: 1 }),
      save: (session) => set((s) => ({ sessions: [session, ...s.sessions.filter((x) => x.id !== session.id)].slice(0, 40) })),
      remove: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
    }),
    {
      name: "liora",
      version: 1,
      partialize: ({ onboarded, voice, length, soundBed, sessions }) => ({ onboarded, voice, length, soundBed, sessions }),
    },
  ),
);
