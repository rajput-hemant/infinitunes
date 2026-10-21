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
};
