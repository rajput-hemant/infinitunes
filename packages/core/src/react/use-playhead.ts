import * as React from "react";

import type { PositionStore } from "./position-store";

/**
 * How often the playhead is sampled while playing. A bar a few hundred pixels
 * wide covers under 4px a second, so 4 samples a second move it by well under
 * a pixel a step: it reads as smooth. Sampling every frame instead damages the
 * glass player 60 times a second and makes the compositor redraw every
 * backdrop behind and over it each time.
 */
export const PLAYHEAD_TICK_MS = 250;

type PlayheadOptions = {
  store: PositionStore;
  getPosition: () => number;
  playing: boolean;
  /** Pauses sampling (the seek bar owns the value while it is dragged). */
  frozen?: boolean;
  tickMs?: number;
};

/**
 * Keeps the position store in step with the audio element: one read on every
 * change of state, then a slow tick only while the audio is actually playing.
 * Paused or idle, nothing runs.
 */
export function usePlayhead({
  store,
  getPosition,
  playing,
  frozen = false,
  tickMs = PLAYHEAD_TICK_MS,
}: PlayheadOptions) {
  React.useEffect(() => {
    if (frozen) return;
    store.set(getPosition());
    if (!playing) return;
    const id = setInterval(() => store.set(getPosition()), tickMs);
    return () => clearInterval(id);
  }, [store, getPosition, playing, frozen, tickMs]);
}
