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
 * The listener's colour scheme choice, kept across launches and applied on
 * every change. The OS keeps no override between launches: `restoreAppearance`
 * applies the saved one at launch.
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
