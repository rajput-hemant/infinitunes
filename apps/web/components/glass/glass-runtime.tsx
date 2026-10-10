"use client";

import { useEffect } from "react";

import { startGlassRuntime } from "./start-glass-runtime";

/**
 * Mount once in the root layout. Starts the glass engine after hydration;
 * renders nothing, and reads no request data, so the layout stays static.
 */
export function GlassRuntime() {
  useEffect(() => startGlassRuntime(), []);
  return null;
}
