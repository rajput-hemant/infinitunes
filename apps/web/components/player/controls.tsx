/** Sets `aria-valuetext` on the range input inside a Base UI slider root. */
export function setValueText(root: HTMLElement | null, text: string) {
  root
    ?.querySelector("input[type=range]")
    ?.setAttribute("aria-valuetext", text);
}

/** Scrubber and volume styling: foreground fill on a neutral track. */
export const scrubClass =
  "[&>*]:py-1 [&_[data-slot=slider-range]]:bg-foreground [&_[data-slot=slider-track]]:bg-fill-2";

/** Accent dot under a transport toggle that is switched on. */
export function ActiveDot({ on }: { on: boolean }) {
  return on ? (
    <span
      aria-hidden
      className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
    />
  ) : null;
}
