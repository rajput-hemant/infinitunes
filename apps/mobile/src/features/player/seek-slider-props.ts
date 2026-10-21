import { space } from "~/theme/tokens";

/**
 * The native slider host's height: a 32pt row holds both platforms' system
 * sliders (iOS's thumb, Material's 20dp handle) without clipping.
 */
export const SLIDER_HOST = { height: space.xxl } as const;

/** The platform seek slider's contract (`seek-slider.ios.tsx`, `seek-slider.tsx`). */
export type SeekSliderProps = {
  /** Seconds. */
  value: number;
  /** The track's duration in seconds. */
  max: number;
  /** The listener dragged to `value`; nothing seeks yet. */
  onScrub: (value: number) => void;
  /** The drag ended: seek to the last scrubbed value. */
  onScrubEnd: () => void;
  /**
   * Colours on an artwork wash: the played part and thumb (3:1 against the
   * wash) and the unplayed track. iOS tints only the played part; its thumb
   * and track stay the system's. Unset: the platform's own colours.
   */
  colors?: { active: string; inactive: string };
};
