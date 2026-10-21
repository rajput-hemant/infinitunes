import { Appearance } from "react-native";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "~/lib/persisted-storage";

export const APPEARANCE_MODES = ["system", "light", "dark"] as const;

export type AppearanceMode = (typeof APPEARANCE_MODES)[number];

type AppearanceState = {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
};

/** `"auto"` hands the colour scheme back to the system setting. */
function applyMode(mode: AppearanceMode) {
  Appearance.setColorScheme(mode === "system" ? "auto" : mode);
}

/**
 * The listener's colour scheme choice, kept across launches. The OS keeps no
 * override between launches, so the saved mode is applied again as soon as
 * this module loads (the store hydrates synchronously) and on every change.
 */
export const appearanceStore = createStore<AppearanceState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => {
        applyMode(mode);
        set({ mode });
      },
    }),
    {
      name: "appearance",
      storage: persistedStorage<Pick<AppearanceState, "mode">>(),
      partialize: ({ mode }) => ({ mode }),
      onRehydrateStorage: () => (state) => {
        if (state) applyMode(state.mode);
      },
    },
  ),
);

export function useAppearanceMode() {
  return useStore(appearanceStore, ({ mode }) => mode);
}
