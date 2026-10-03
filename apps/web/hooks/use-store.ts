import type {
  ActiveRadioSession,
  ImageQuality,
  Queue,
  StreamQuality,
} from "@infinitunes/types";
import { ensureQueueItemIds } from "@infinitunes/types";
import { atom, createStore, useAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

const store = createStore();

// Queues persisted before `queueItemId` existed are backfilled on read.
const baseQueueStorage = createJSONStorage<Queue[]>(() => localStorage);
const queueStorage: typeof baseQueueStorage = {
  ...baseQueueStorage,
  getItem: (key, initialValue) =>
    ensureQueueItemIds(baseQueueStorage.getItem(key, initialValue)),
};

const queueAtom = atomWithStorage<Queue[]>("queue", [], queueStorage);

export function useQueue() {
  return useAtom(queueAtom, { store });
}

const currentSongIndexAtom = atomWithStorage("current_song_index", 0);

export function useCurrentSongIndex() {
  return useAtom(currentSongIndexAtom, { store });
}

const streamQualityAtom = atomWithStorage<StreamQuality>(
  "stream_quality",
  "excellent",
);

export function useStreamQuality() {
  return useAtom(streamQualityAtom, { store });
}

const downloadQualityAtom = atomWithStorage<StreamQuality>(
  "download_quality",
  "excellent",
);

export function useDownloadQuality() {
  return useAtom(downloadQualityAtom, { store });
}

const imageQualityAtom = atomWithStorage<ImageQuality>("image_quality", "high");

export function useImageQuality() {
  return useAtom(imageQualityAtom, { store });
}

const isPlayingAtom = atom(false);

export function useIsPlayerInit() {
  return useAtom(isPlayingAtom, { store });
}

const isTyping = atom(false);

export function useIsTyping() {
  return useAtom(isTyping, { store });
}

const activeRadioSessionAtom = atomWithStorage<ActiveRadioSession | null>(
  "active_radio_session",
  null,
);

export function useActiveRadioSession() {
  return useAtom(activeRadioSessionAtom, { store });
}

const keyboardShortcutsAtom = atomWithStorage("keyboard_shortcuts", true);

/** WCAG 2.1.4: single-key player shortcuts can be turned off. Default on. */
export function useKeyboardShortcuts() {
  return useAtom(keyboardShortcutsAtom, { store });
}
