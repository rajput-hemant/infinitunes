import type {
  ActiveRadioSession,
  ImageQuality,
  Queue,
  StreamQuality,
} from "@infinitunes/types";
import { ensureQueueItemIds } from "@infinitunes/types";
import { atom, createStore, useSetAtom } from "jotai";
import type { WritableAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import * as React from "react";

const store = createStore();

// jotai's `useAtom` reads the value once at render and only listens for later
// changes, so a component whose effect subscribes after another one has already
// mounted an `atomWithStorage` atom (which restores localStorage on mount) never
// sees the restored value. `useSyncExternalStore` re-reads the snapshot on
// subscribe, so every consumer gets it, and it hydrates from the server value.
function useAtom<Value, Args extends unknown[], Result>(
  target: WritableAtom<Value, Args, Result>,
  _options: { store: typeof store },
) {
  // A stable `subscribe`: a new identity would unsubscribe and resubscribe on
  // every render, remounting the atom and re-reading storage each time.
  const subscribe = React.useCallback(
    (onChange: () => void) => store.sub(target, onChange),
    [target],
  );
  const getSnapshot = React.useCallback(() => store.get(target), [target]);
  const value = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [value, useSetAtom(target, { store })] as const;
}

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
