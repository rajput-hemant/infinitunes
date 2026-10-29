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
  /** A pending transport press, until the engine acknowledges it. */
  playingIntent: boolean | null;
  buffering: boolean;
  /** Seconds; 0 until the source has loaded. */
  duration: number;
  /** End of the loaded range containing the playhead, in seconds. */
  bufferedTime: number;
};

export const playbackStatusStore = createStore<PlaybackStatus>()(() => ({
  playing: false,
  playingIntent: null,
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

let intentTimer: ReturnType<typeof setTimeout> | undefined;

/** Shared by every play button; native status remains authoritative for playback. */
export function requestPlaying(playing: boolean | null) {
  clearTimeout(intentTimer);
  playbackStatusStore.setState({ playingIntent: playing });
  if (playing !== null) {
    intentTimer = setTimeout(() => {
      playbackStatusStore.setState({ playingIntent: null });
    }, 1500);
  }
}
