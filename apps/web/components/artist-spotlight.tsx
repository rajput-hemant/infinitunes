"use client";

import * as React from "react";

import { prefersReducedMotion } from "~/lib/glass/motion";
import { cn } from "~/lib/utils";

/** How long each artist stays on screen before the next one fades in. */
export const SPOTLIGHT_INTERVAL_MS = 6000;

type SpotlightState = { index: number; previous: number | null };

type ArtistSpotlightProps = {
  images: readonly string[];
  className?: string;
};

/**
 * One artist at a time, crossfading to the next. Only the current image and
 * the one fading out are mounted, so the panel downloads one image up front
 * instead of the whole set. Holds on the first image when the user asked for
 * less motion, and skips turns while the tab is hidden.
 */
export function ArtistSpotlight({ images, className }: ArtistSpotlightProps) {
  const count = images.length;
  const [{ index, previous }, advance] = React.useReducer(
    (state: SpotlightState): SpotlightState => ({
      index: (state.index + 1) % count,
      previous: state.index,
    }),
    { index: 0, previous: null },
  );

  React.useEffect(() => {
    if (count < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      if (!document.hidden) advance();
    }, SPOTLIGHT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [count]);

  // Warm the cache for the next artist so its fade-in never shows a blank.
  React.useEffect(() => {
    if (count < 2) return;
    const next = images[(index + 1) % count];
    if (next) new Image().src = next;
  }, [images, index, count]);

  return (
    <div className={cn("absolute inset-0", className)}>
      {images.map((src, i) =>
        i === index || i === previous ? (
          <img
            key={src}
            src={src}
            alt=""
            data-active={i === index ? "" : undefined}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={cn(
              "absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-1000 ease-out data-active:opacity-90 motion-reduce:transition-none",
              // The first paint shows the image at once, so it can count as LCP.
              previous !== null && "starting:opacity-0",
            )}
          />
        ) : null,
      )}
    </div>
  );
}
