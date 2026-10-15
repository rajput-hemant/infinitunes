"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

import { registerWhenReady } from "~/components/glass/glass-loader";

/**
 * Registers a glass host with the lens registry once it has hydrated. The
 * runtime cannot scan server HTML itself: writing `--g-lens-url` onto an
 * element React has not hydrated yet is a hydration attribute mismatch.
 */
export function useGlassRegistration(
  hostRef: RefObject<HTMLElement | null>,
  /** Re-registers when the surface's role or size changes. */
  ...deps: readonly unknown[]
) {
  useEffect(() => {
    const el = hostRef.current;
    if (!el?.hasAttribute("data-glass")) return;
    return registerWhenReady(el);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- deps are the surface attributes the caller lists
  }, [hostRef, ...deps]);
}
