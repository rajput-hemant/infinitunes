import { atom, createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { ImageQuality, Queue, StreamQuality } from "@/types";

const store = createStore();

const queueAtom = atomWithStorage<Queue[]>("queue", []);

export function useQueue() {
  return useAtom(queueAtom, { store });
}

const currentSongIndexAtom = atomWithStorage("current_song_index", 0);

export function useCurrentSongIndex() {
  return useAtom(currentSongIndexAtom, { store });
}

const streamQualityAtom = atomWithStorage<StreamQuality>(
  "stream_quality",
  "excellent"
);

export function useStreamQuality() {
  return useAtom(streamQualityAtom, { store });
}

const downloadQualityAtom = atomWithStorage<StreamQuality>(
  "download_quality",
  "excellent"
);

export function useDownloadQuality() {
  return useAtom(downloadQualityAtom, { store });
}

const imageQualityAtom = atomWithStorage<ImageQuality>("image_quality", "high");

export function useImageQuality() {
  return useAtom(imageQualityAtom, { store });
}

const playerCurrentTimeAtom = atom(0);

export function usePlayerCurrentTime() {
  return useAtom(playerCurrentTimeAtom, { store });
}

const isPlayingAtom = atom(false);

export function useIsPlayerInit() {
  return useAtom(isPlayingAtom, { store });
}

const isTyping = atom(false);

export function useIsTyping() {
  return useAtom(isTyping, { store });
}
