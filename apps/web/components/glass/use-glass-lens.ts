"use client";

import { useEffect, type RefObject } from "react";

import type { GlassSize } from "~/lib/glass/lens-math";

import { registerGlass } from "./lens-registry";

export type GlassLensOpts = {
  size?: GlassSize;
  /** Magnifying droplet lens, for a lifted selection indicator. */
  magnify?: boolean;
  off?: boolean;
};

/**
 * Registers an element that is not a `data-glass` surface or a known popup
 * (those are found by `GlassRuntime`) with the lens engine. The engine itself
 * (capability, level, accessibility gates) lives in `GlassRuntime`.
 */
export function useGlassLens(
  ref: RefObject<HTMLElement | null>,
  { size = "m", magnify = false, off = false }: GlassLensOpts,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || off) return;
    return registerGlass(el, { size, magnify });
  }, [ref, size, magnify, off]);
}
