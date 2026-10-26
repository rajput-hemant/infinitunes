import { selection, tap } from "~/lib/haptics";

/** The player's haptics, on the app's shared intents (`lib/haptics`). */
export const playerHaptics = {
  /** Play, pause, next, previous, and a swipe that changed the song. */
  press: tap,
  /** The seek slider crossing a step while dragged. */
  tick: selection,
  /** The seek slider let go. */
  release: tap,
};

/** The seek slider ticks once per this share of the track. */
export const SCRUB_TICK_SHARE = 0.05;

/** Which tick step `seconds` falls in, so a drag ticks when it changes. */
export function scrubStep(seconds: number, duration: number): number {
  return Math.floor(seconds / Math.max(duration * SCRUB_TICK_SHARE, 1));
}
