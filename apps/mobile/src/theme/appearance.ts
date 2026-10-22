import { Appearance } from "react-native";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "~/lib/persisted-storage";

import { ACCENTS, CORNER_STYLES } from "./tokens";
import type { AccentId, CornerStyle } from "./tokens";

export const APPEARANCE_MODES = ["system", "light", "dark"] as const;

export type AppearanceMode = (typeof APPEARANCE_MODES)[number];

type AppearanceState = {
  mode: AppearanceMode;
  accent: AccentId;
  corners: CornerStyle;
  setMode: (mode: AppearanceMode) => void;
  setAccent: (accent: AccentId) => void;
  setCorners: (corners: CornerStyle) => void;
};

type Saved = Pick<AppearanceState, "mode" | "accent" | "corners">;

/** `"auto"` hands the colour scheme back to the system setting. */
function applyMode(mode: AppearanceMode) {
  Appearance.setColorScheme(mode === "system" ? "auto" : mode);
}

/**
 * The listener's colour scheme choice, kept across launches and applied on
 * every change. The OS keeps no override between launches: `restoreAppearance`
 * applies the saved one at launch.
 */
export const appearanceStore = createStore<AppearanceState>()(
  persist(
    (set) => ({
      mode: "system",
      accent: "default",
      corners: "default",
      setMode: (mode) => {
        applyMode(mode);
        set({ mode });
      },
      setAccent: (accent) => set({ accent }),
      setCorners: (corners) => set({ corners }),
    }),
    {
      name: "appearance",
      version: 1,
      migrate: (saved) => saved as Saved,
      storage: persistedStorage<Saved>(),
      partialize: ({ mode, accent, corners }) => ({ mode, accent, corners }),
      // A saved value this build no longer knows falls back to the default.
      merge: (saved, current) => {
        const value = (saved ?? {}) as Partial<Saved>;
        return {
          ...current,
          ...value,
          accent:
            value.accent && value.accent in ACCENTS ? value.accent : "default",
          corners:
            value.corners && value.corners in CORNER_STYLES
              ? value.corners
              : "default",
        };
      },
    },
  ),
);

/** Applies the saved mode (the store hydrates synchronously); `AppProviders` calls it at launch. */
export function restoreAppearance() {
  applyMode(appearanceStore.getState().mode);
}

export function useAppearanceMode() {
  return useStore(appearanceStore, ({ mode }) => mode);
}

export function useAccent() {
  return useStore(appearanceStore, ({ accent }) => accent);
}

export function useCornerStyle() {
  return useStore(appearanceStore, ({ corners }) => corners);
}
