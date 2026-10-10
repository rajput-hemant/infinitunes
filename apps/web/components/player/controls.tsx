import * as React from "react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** Sets `aria-valuetext` on the range input inside a Base UI slider root. */
function setValueText(root: HTMLElement | null, text: string) {
  root
    ?.querySelector("input[type=range]")
    ?.setAttribute("aria-valuetext", text);
}

/** The value of a single-thumb slider as passed to `onValueChange`. */
export function sliderValueOf(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0);
}

/**
 * Keeps a slider's readable value in step with `text`. The Slider wrapper does
 * not forward per-thumb props, so the value is set on the range input.
 */
export function useSliderValueText(text: string) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    setValueText(ref.current, text);
  }, [text]);
  return ref;
}

/** Scrubber and volume styling: foreground fill on a neutral track. */
export const scrubClass =
  "[&>*]:py-1 [&_[data-slot=slider-range]]:bg-foreground [&_[data-slot=slider-track]]:bg-fill-2";

/** Plain controls on the expanded player's artwork wash. */
export const washButtonClass = cn(
  controlStyles.transport,
  "flex shrink-0 items-center justify-center transition-[background-color,scale] duration-fast ease-spring hover:bg-fill active:scale-[0.96] active:bg-fill-2",
);

/** Glass controls on the wash; their press comes from the glass runtime. */
export const washGlassButtonClass = cn(
  controlStyles.transport,
  "flex shrink-0 items-center justify-center",
);

/** Accent dot under a transport toggle that is switched on. */
export function ActiveDot({ on }: { on: boolean }) {
  return on ? (
    <span
      aria-hidden
      className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
    />
  ) : null;
}
