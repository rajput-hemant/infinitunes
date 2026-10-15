import type { RefObject } from "react";
import { useEffect } from "react";

import { TOOLBAR_SELECTOR } from "~/components/site-header/toolbar-slots";

type TitleReading = Pick<
  IntersectionObserverEntry,
  "isIntersecting" | "boundingClientRect"
>;

/**
 * The heading is hidden under the toolbar when it is off the top of the
 * viewport past the toolbar's bottom edge, not when it is below the fold.
 */
export function isTitleUnderToolbar(reading: TitleReading, inset: number) {
  return !reading.isIntersecting && reading.boundingClientRect.top < inset;
}

/**
 * Writes the title signal onto the toolbar, which lives in the layout and so
 * outside this subtree: `data-glass-titled` while the heading is under the bar
 * (it fades the page title into the toolbar). It is removed on unmount. The
 * capsules themselves never change look over the artwork: they stay regular.
 */
export function useToolbarArt(frame: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const toolbar = document.querySelector<HTMLElement>(TOOLBAR_SELECTOR);
    if (!toolbar) return;

    const heading = frame.current?.querySelector("h1");
    const inset = toolbar.offsetHeight;

    const observer = new IntersectionObserver(
      (entries) => {
        const reading = entries.at(-1);
        if (!reading) return;
        toolbar.toggleAttribute(
          "data-glass-titled",
          isTitleUnderToolbar(reading, inset),
        );
      },
      { rootMargin: `-${inset}px 0px 0px 0px` },
    );
    if (heading) observer.observe(heading);

    return () => {
      observer.disconnect();
      toolbar.removeAttribute("data-glass-titled");
    };
  }, [frame]);
}
