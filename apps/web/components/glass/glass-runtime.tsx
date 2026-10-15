"use client";

import { useEffect } from "react";

import { startGlassOnIdle } from "./glass-loader";

/**
 * Mount once in the root layout. Starts the glass engine when the browser is
 * idle after hydration (the engine is its own chunk, so it is not in the first
 * load); until then every surface shows the frosted fallback. Renders nothing,
 * and reads no request data, so the layout stays static.
 */
export function GlassRuntime() {
  useEffect(() => startGlassOnIdle(), []);
  return null;
}
