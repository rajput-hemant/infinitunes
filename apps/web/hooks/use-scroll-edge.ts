"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { SCROLLED_AFTER, isScrolled } from "~/lib/glass/scroll-edge";

export type ScrollEdgeOptions = {
  /** Scroll distance (px) past which the edge fades in. */
  threshold?: number;
  /** A scroll container; the window when omitted. */
  scroller?: RefObject<HTMLElement | null>;
};

/**
 * Drives the top scroll edge effect: toggles `data-scrolled` on the returned
 * ref's element once the page (or `scroller`) has scrolled past `threshold`.
 * Put the ref on the toolbar wrapper that carries `data-glass-edge="top"`
 * (a wrapper, not a glass surface itself). Imperative, so scrolling never
 * re-renders React.
 */
export function useScrollEdge<T extends HTMLElement>({
  threshold = SCROLLED_AFTER,
  scroller,
}: ScrollEdgeOptions = {}): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = scroller?.current ?? null;
    const source: HTMLElement | Window = container ?? window;
    const position = () => (container ? container.scrollTop : window.scrollY);

    const update = () => {
      const value = String(isScrolled(position(), threshold));
      if (el.dataset.scrolled !== value) el.dataset.scrolled = value;
    };
    update();
    source.addEventListener("scroll", update, { passive: true });
    return () => {
      source.removeEventListener("scroll", update);
      delete el.dataset.scrolled;
    };
  }, [threshold, scroller]);

  return ref;
}
