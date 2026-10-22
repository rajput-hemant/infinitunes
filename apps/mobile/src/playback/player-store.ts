import {
  nextLoopMode,
  nextTrackIndex,
  prevTrackIndex,
  shuffled,
  type LoopMode,
} from "@infinitunes/core/playback-order";
import type {
  ActiveRadioSession,
  Queue,
  QueueSource,
} from "@infinitunes/types";
import {
  ensureQueueItemIds,
  removeFromQueue,
  toQueueEntry,
} from "@infinitunes/types";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "~/lib/persisted-storage";

import { beginPlaybackRequest } from "./playback-request";

type PlayerState = {
  queue: Queue[];
  currentIndex: number;
  /**
   * Set by the first play in this app run. A queue restored at launch waits
   * for it, so opening the app never starts the music by itself.
   */
  started: boolean;
  shuffle: boolean;
  repeat: LoopMode;
  /** The station whose songs refill the queue as it runs out. */
  radio: ActiveRadioSession | null;
  /**
   * Bumped when a play lands on the entry that is already loaded (Play on
   * the list that is paused on it, the end of a one-entry looping queue):
   * nothing new loads, so the controller resumes the engine instead.
   */
  resumeRequest: number;
  /** Bumped when Play lands on an entry whose source failed or was cleared: it loads again. */
  retryRequest: number;
};

type PlayOptions = {
  startIndex?: number;
  /** Queue the tracks in a random order and start from the first. */
  shuffle?: boolean;
  radio?: ActiveRadioSession;
};

type PlayerActions = {
  /** Replaces the queue with `tracks` and plays from `startIndex`. */
  playTracks: (tracks: readonly QueueSource[], options?: PlayOptions) => void;
  /** Jumps to an entry already in the queue. */
  playAt: (index: number) => void;
  /** Starts the restored queue (the first play of this run). */
  start: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  /** The current track played to its end. */
  advanceAfterEnd: () => void;
  /** Every bitrate of the current entry failed; move on unless it is the only one. */
  skipUnplayable: () => boolean;
  addToQueue: (track: QueueSource) => void;
  /** Queues the track right after the current one. */
  playNext: (track: QueueSource) => void;
  /** Inserts `tracks`, in order, right after the current one or at the end. */
  addMany: (tracks: readonly QueueSource[], position: "next" | "last") => void;
  removeAt: (index: number) => void;
  /** Drops every entry after the current one (the queue's "Clear"). */
  clearUpNext: () => void;
  /** Moves the entry at `from` to `to`; the current entry keeps playing. */
  moveInQueue: (from: number, to: number) => void;
  toggleShuffle: () => void;
  /** Moves the repeat control on and returns the new mode. */
  cycleRepeat: () => LoopMode;
  /** Applies `update` to the queue without moving playback (radio refill). */
  updateQueue: (update: (queue: Queue[]) => Queue[]) => void;
};

type Persisted = Omit<
  PlayerState,
  "started" | "resumeRequest" | "retryRequest"
>;

export type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  queue: [],
  currentIndex: 0,
  started: false,
  shuffle: false,
  repeat: "off",
  radio: null,
  resumeRequest: 0,
  retryRequest: 0,
};

function playbackOrder(state: PlayerState) {
  return {
    length: state.queue.length,
    currentIndex: state.currentIndex,
    shuffle: state.shuffle,
    loopPlaylist: state.repeat === "playlist",
  };
}

/** Same tracks in the same order: playing them again only moves the position. */
function isSameQueue(queue: readonly Queue[], tracks: readonly QueueSource[]) {
  return (
    queue.length === tracks.length &&
    queue.every((entry, index) => entry.id === tracks[index]?.id)
  );
}

/**
 * The queue and how it plays. Pure state: the playback controller loads
 * whatever entry this points at, so screens only call these actions
 * (`playerStore.getState().playTracks(...)` in a handler) and read it with
 * `usePlayer(selector)`.
 */
export const playerStore = createStore<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      playTracks(tracks, { startIndex = 0, shuffle = false, radio } = {}) {
        beginPlaybackRequest();
        if (tracks.length === 0) return;
        const index = Math.min(Math.max(startIndex, 0), tracks.length - 1);
        const radioState = { radio: radio ?? null };
        const state = get();
        if (!shuffle && isSameQueue(state.queue, tracks)) {
          const loaded = state.started && state.currentIndex === index;
          set({
            currentIndex: index,
            started: true,
            ...radioState,
            ...(loaded ? { resumeRequest: state.resumeRequest + 1 } : {}),
          });
          return;
        }
        const ordered = shuffle ? shuffled(tracks) : tracks;
        set({
          queue: ordered.map(toQueueEntry),
          currentIndex: shuffle ? 0 : index,
          started: true,
          ...radioState,
        });
      },

      playAt(index) {
        const state = get();
        if (index < 0 || index >= state.queue.length) return;
        beginPlaybackRequest();
        set({
          currentIndex: index,
          started: true,
          ...(state.started && state.currentIndex === index
            ? { resumeRequest: state.resumeRequest + 1 }
            : {}),
        });
      },

      start() {
        beginPlaybackRequest();
        if (get().queue.length > 0) set({ started: true });
      },

      skipToNext() {
        beginPlaybackRequest();
        set((state) => ({
          currentIndex: nextTrackIndex(playbackOrder(state), {
            reason: "skip",
          }),
          started: true,
        }));
      },

      skipToPrevious() {
        beginPlaybackRequest();
        set((state) => ({
          currentIndex: prevTrackIndex(playbackOrder(state)),
          started: true,
        }));
      },

      advanceAfterEnd() {
        set((state) => {
          const repeatOne = state.repeat === "track";
          const currentIndex = nextTrackIndex(playbackOrder(state), {
            reason: "ended",
            repeatOne,
          });
          // A looping queue of one entry wraps onto the entry that just
          // ended; repeat-one is the engine's own loop.
          const wrapped =
            !repeatOne &&
            state.repeat === "playlist" &&
            currentIndex === state.currentIndex;
          return wrapped
            ? { currentIndex, resumeRequest: state.resumeRequest + 1 }
            : { currentIndex };
        });
      },

      skipUnplayable() {
        const before = get().currentIndex;
        if (get().queue.length < 2) return false;
        set((state) => ({
          currentIndex: nextTrackIndex(playbackOrder(state), {
            reason: "skip",
          }),
        }));
        return get().currentIndex !== before;
      },

      addToQueue(track) {
        set((state) => ({ queue: [...state.queue, toQueueEntry(track)] }));
      },

      playNext(track) {
        get().addMany([track], "next");
      },

      addMany(tracks, position) {
        set((state) => {
          const at =
            position === "last" || state.queue.length === 0
              ? state.queue.length
              : state.currentIndex + 1;
          const queue = [...state.queue];
          queue.splice(at, 0, ...tracks.map(toQueueEntry));
          return { queue };
        });
      },

      removeAt(index) {
        set((state) => removeFromQueue(state.queue, state.currentIndex, index));
      },

      clearUpNext() {
        set((state) => ({
          queue: state.queue.slice(0, state.currentIndex + 1),
        }));
      },

      moveInQueue(from, to) {
        set((state) => {
          const { queue, currentIndex } = state;
          const entry = queue[from];
          if (!entry || from === to || to < 0 || to >= queue.length) {
            return state;
          }
          const playing = queue[currentIndex]?.queueItemId;
          const next = queue.filter((_, index) => index !== from);
          next.splice(to, 0, entry);
          const index = next.findIndex((item) => item.queueItemId === playing);
          return { queue: next, currentIndex: Math.max(index, 0) };
        });
      },

      toggleShuffle() {
        set((state) => ({ shuffle: !state.shuffle }));
      },

      cycleRepeat() {
        const repeat = nextLoopMode(get().repeat, get().queue.length);
        set({ repeat });
        return repeat;
      },

      updateQueue(update) {
        set((state) => ({ queue: update(state.queue) }));
      },
    }),
    {
      name: "player",
      version: 1,
      migrate: (saved) => saved as Persisted,
      merge: (persisted, current) => {
        const saved = persisted as Partial<PlayerStore> | undefined;
        return {
          ...current,
          ...saved,
          queue: ensureQueueItemIds(saved?.queue ?? []),
        };
      },
      storage: persistedStorage<Persisted>(),
      partialize: ({ queue, currentIndex, shuffle, repeat, radio }) => ({
        queue,
        currentIndex,
        shuffle,
        repeat,
        radio,
      }),
    },
  ),
);

/** Subscribes to one slice of the player; re-renders only when it changes. */
export function usePlayer<Slice>(selector: (state: PlayerStore) => Slice) {
  return useStore(playerStore, selector);
}

/** The entry the player is on, if any. */
export function selectCurrentTrack(state: PlayerState): Queue | undefined {
  return state.queue[state.currentIndex];
}
