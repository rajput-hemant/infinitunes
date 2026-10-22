import type { ImageQuality, Lang, StreamQuality } from "@infinitunes/types";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "./persisted-storage";

type Preferences = {
  /** Bitrate playback asks for first; it steps down on a load error. */
  streamQuality: StreamQuality;
  cacheFrequentSongs: boolean;
  /** Bitrate a download asks for, capped at what the song has. */
  downloadQuality: StreamQuality;
  /** The largest artwork the app loads; smaller layouts ask for less anyway. */
  imageQuality: ImageQuality;
  /**
   * The languages of Home, Charts and New Releases (the web's `language`
   * preference); empty is the catalog's own default, Hindi and English.
   */
  languages: Lang[];
};

type PreferenceActions = {
  setStreamQuality: (quality: StreamQuality) => void;
  setCacheFrequentSongs: (enabled: boolean) => void;
  setDownloadQuality: (quality: StreamQuality) => void;
  setImageQuality: (quality: ImageQuality) => void;
  setLanguages: (languages: Lang[]) => void;
};

type PreferencesStore = Preferences & PreferenceActions;

/** The listener's playback and catalog preferences, kept across launches (the web's defaults). */
export const preferencesStore = createStore<PreferencesStore>()(
  persist(
    (set) => ({
      streamQuality: "excellent",
      cacheFrequentSongs: true,
      setCacheFrequentSongs: (cacheFrequentSongs) =>
        set({ cacheFrequentSongs }),
      downloadQuality: "excellent",
      imageQuality: "high",
      languages: [],
      setStreamQuality: (streamQuality) => set({ streamQuality }),
      setDownloadQuality: (downloadQuality) => set({ downloadQuality }),
      setImageQuality: (imageQuality) => set({ imageQuality }),
      setLanguages: (languages) => set({ languages }),
    }),
    {
      name: "preferences",
      storage: persistedStorage<Preferences>(),
      partialize: ({
        streamQuality,
        cacheFrequentSongs,
        downloadQuality,
        imageQuality,
        languages,
      }) => ({
        streamQuality,
        cacheFrequentSongs,
        downloadQuality,
        imageQuality,
        languages,
      }),
    },
  ),
);

export function usePreferences<Slice>(
  selector: (preferences: PreferencesStore) => Slice,
) {
  return useStore(preferencesStore, selector);
}

/**
 * The `lang` input of the catalog procedures that follow the language
 * preference, as the web passes it: a comma-separated list, or `undefined`
 * for the catalog's default. Part of their inputs, so part of their query keys.
 */
export function useCatalogLang(): string | undefined {
  return usePreferences(({ languages }) => languages.join(",") || undefined);
}
