import { atom, createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { ImageQuality, Queue, StreamQuality } from "@/types";

const store = createStore();

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
