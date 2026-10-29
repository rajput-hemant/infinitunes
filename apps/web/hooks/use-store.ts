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
  serverValue: Value,
) {
  // A stable `subscribe`: a new identity would unsubscribe and resubscribe on
  // every render, remounting the atom and re-reading storage each time.
  const subscribe = React.useCallback(
    (onChange: () => void) => store.sub(target, onChange),
    [target],
  );
  const getSnapshot = React.useCallback(() => store.get(target), [target]);
  // The server snapshot is the atom's default, not the live value: a Suspense
  // boundary that hydrates after the player already restored localStorage
  // would otherwise render the restored value against server HTML built from
  // the default (hydration mismatch). React re-reads `getSnapshot` right after
  // hydrating, so the restored value still lands.
  const getServerSnapshot = React.useCallback(() => serverValue, [serverValue]);
  const value = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return [value, useSetAtom(target, { store })] as const;
}

// Queues persisted before `queueItemId` existed are backfilled on read.
const baseQueueStorage = createJSONStorage<Queue[]>(() => localStorage);
const queueStorage: typeof baseQueueStorage = {
  ...baseQueueStorage,
  getItem: (key, initialValue) =>
    ensureQueueItemIds(baseQueueStorage.getItem(key, initialValue)),
};

// One stable empty array: a fresh `[]` per call would make the snapshot unstable.
const EMPTY_QUEUE: Queue[] = [];
const queueAtom = atomWithStorage<Queue[]>("queue", EMPTY_QUEUE, queueStorage);

export function useQueue() {
  return useAtom(queueAtom, EMPTY_QUEUE);
}

const currentSongIndexAtom = atomWithStorage("current_song_index", 0);

export function useSetCurrentSongIndex() {
  return useSetAtom(currentSongIndexAtom, { store });
}

export function useCurrentSongIndex() {
  return useAtom(currentSongIndexAtom, 0);
}

const streamQualityAtom = atomWithStorage<StreamQuality>(
  "stream_quality",
  "excellent",
);

export function useStreamQuality() {
  return useAtom(streamQualityAtom, "excellent");
}

const downloadQualityAtom = atomWithStorage<StreamQuality>(
  "download_quality",
  "excellent",
);

export function useDownloadQuality() {
  return useAtom(downloadQualityAtom, "excellent");
}

const imageQualityAtom = atomWithStorage<ImageQuality>("image_quality", "high");

export function useImageQuality() {
  return useAtom(imageQualityAtom, "high");
}

const isPlayerInitAtom = atom(false);

export function useSetIsPlayerInit() {
  return useSetAtom(isPlayerInitAtom, { store });
}

export function useIsPlayerInit() {
  return useAtom(isPlayerInitAtom, false);
}

const isTyping = atom(false);

export function useIsTyping() {
  return useAtom(isTyping, false);
}

const activeRadioSessionAtom = atomWithStorage<ActiveRadioSession | null>(
  "active_radio_session",
  null,
);

export function useSetActiveRadioSession() {
  return useSetAtom(activeRadioSessionAtom, { store });
}

export function useActiveRadioSession() {
  return useAtom(activeRadioSessionAtom, null);
}

const keyboardShortcutsAtom = atomWithStorage("keyboard_shortcuts", true);

/** WCAG 2.1.4: single-key player shortcuts can be turned off. Default on. */
export function useKeyboardShortcuts() {
  return useAtom(keyboardShortcutsAtom, true);
}
