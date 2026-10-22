import {
  createPositionStore,
  usePosition,
} from "@infinitunes/core/react/position-store";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/**
 * What the engine is doing, mirrored by the playback controller. A store of
 * its own (not the engine's status hook) so a play button re-renders when
 * `playing` flips, not on every status tick.
 */
export type PlaybackStatus = {
  playing: boolean;
  buffering: boolean;
  /** Seconds; 0 until the source has loaded. */
  duration: number;
  /** End of the loaded range containing the playhead, in seconds. */
  bufferedTime: number;
};

export const playbackStatusStore = createStore<PlaybackStatus>()(() => ({
  playing: false,
  buffering: false,
  duration: 0,
  bufferedTime: 0,
}));

export function usePlaybackStatus<Slice>(
  selector: (status: PlaybackStatus) => Slice,
) {
  return useStore(playbackStatusStore, selector);
}

/** The playhead in seconds, sampled by the controller while playing (`usePlayhead`). */
export const playbackPosition = createPositionStore();

export function usePlaybackPosition() {
  return usePosition(playbackPosition);
}
