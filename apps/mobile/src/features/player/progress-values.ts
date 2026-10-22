import { useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";

import {
  playbackPosition,
  playbackStatusStore,
} from "~/playback/playback-status";

function fraction(part: number, whole: number) {
  return whole > 0 ? Math.min(Math.max(part / whole, 0), 1) : 0;
}

function current(override: number | null) {
  const { duration, bufferedTime } = playbackStatusStore.getState();
  return {
    played: fraction(override ?? playbackPosition.get(), duration),
    buffered: fraction(bufferedTime, duration),
  };
}

/**
 * The played and buffered fractions (0 to 1) as shared values, fed straight
 * from the playback stores: a tick moves the bar on the UI thread and never
 * re-renders React. `override` is a position that wins over the playhead (a
 * drag in progress).
 */
export function useProgressValues(override: number | null = null) {
  // Seeded from the stores, so the first frame is already in place.
  const played = useSharedValue(current(override).played);
  const buffered = useSharedValue(current(override).buffered);

  useEffect(() => {
    function update() {
      const next = current(override);
      played.set(next.played);
      buffered.set(next.buffered);
    }
    update();
    const stopPosition = playbackPosition.subscribe(update);
    const stopStatus = playbackStatusStore.subscribe(update);
    return () => {
      stopPosition();
      stopStatus();
    };
  }, [override, played, buffered]);

  return { played, buffered };
}
