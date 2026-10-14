import { RADIUS_MAX_REM } from "@infinitunes/types";
import type { ThemeConfig } from "@infinitunes/types";

const PX_PER_REM = 16;
const RADIUS_MAX_PX = RADIUS_MAX_REM * PX_PER_REM;

export function radiusToPx(rem: number): number {
  return Math.round(rem * PX_PER_REM);
}

/** Slider ticks are whole pixels; the config stores rem and clamps to 0 to 24px. */
export function radiusPatch(px: number): Pick<ThemeConfig, "radius"> {
  const clamped = Math.min(RADIUS_MAX_PX, Math.max(0, Math.round(px)));
  return { radius: clamped / PX_PER_REM };
}
