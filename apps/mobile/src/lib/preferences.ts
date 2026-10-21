import type { StreamQuality } from "@infinitunes/types";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "./persisted-storage";

type Preferences = {
  /** Bitrate playback asks for first; it steps down on a load error. */
  streamQuality: StreamQuality;
  /** Bitrate a download asks for, capped at what the song has. */
  downloadQuality: StreamQuality;
};

type PreferenceActions = {
  setStreamQuality: (quality: StreamQuality) => void;
  setDownloadQuality: (quality: StreamQuality) => void;
};

type PreferencesStore = Preferences & PreferenceActions;

/** The listener's playback preferences, kept across launches (the web's defaults). */
export const preferencesStore = createStore<PreferencesStore>()(
  persist(
    (set) => ({
      streamQuality: "excellent",
      downloadQuality: "excellent",
      setStreamQuality: (streamQuality) => set({ streamQuality }),
      setDownloadQuality: (downloadQuality) => set({ downloadQuality }),
    }),
    {
      name: "preferences",
      storage: persistedStorage<Preferences>(),
      partialize: ({ streamQuality, downloadQuality }) => ({
        streamQuality,
        downloadQuality,
      }),
    },
  ),
);

export function usePreferences<Slice>(
  selector: (preferences: PreferencesStore) => Slice,
) {
  return useStore(preferencesStore, selector);
}
