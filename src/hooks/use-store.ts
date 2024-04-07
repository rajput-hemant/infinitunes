import { atom, createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { Theme } from "@/config/themes";
import type { ImageQuality, Lang, Queue, StreamQuality } from "@/types";

const store = createStore();

type Config = {
  theme: {
    name: "default" | Theme["name"];
    radius: "default" | number;
  };
  languages: Lang[];
};

const configAtom = atomWithStorage<Config>("config", {
  theme: {
    name: "default",
    radius: "default",
  },
  languages: ["hindi", "english"],
});

const queueAtom = atomWithStorage<Queue[]>("queue", []);
const currentSongIndexAtom = atomWithStorage("current_song_index", 0);
const streamQualityAtom = atomWithStorage<StreamQuality>(
  "stream_quality",
  "excellent"
);
const downloadQualityAtom = atomWithStorage<StreamQuality>(
  "download_quality",
  "excellent"
);
const imageQualityAtom = atomWithStorage<ImageQuality>("image_quality", "high");

const playerCurrentTimeAtom = atom(0);
const isPlayingAtom = atom(false);
const isSearchingAtom = atom(false);

export function useConfig() {
  return useAtom(configAtom, { store });
}

export function useQueue() {
  return useAtom(queueAtom, { store });
}

export function useCurrentSongIndex() {
  return useAtom(currentSongIndexAtom, { store });
}

export function useStreamQuality() {
  return useAtom(streamQualityAtom, { store });
}

export function useDownloadQuality() {
  return useAtom(downloadQualityAtom, { store });
}

export function useImageQuality() {
  return useAtom(imageQualityAtom, { store });
}

export function usePlayerCurrentTime() {
  return useAtom(playerCurrentTimeAtom, { store });
}

export function useIsPlayerInit() {
  return useAtom(isPlayingAtom, { store });
}

export function useIsSearching() {
  return useAtom(isSearchingAtom, { store });
}
