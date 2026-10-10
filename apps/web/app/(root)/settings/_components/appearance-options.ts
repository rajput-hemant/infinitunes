import { RADIUS_MAX_REM } from "@infinitunes/types";
import type { ThemeConfig } from "@infinitunes/types";

import { themes } from "~/config/themes";
import { normalizeHex } from "~/lib/theme/oklch";

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

export function isPresetAccent(accent: string): boolean {
  return themes.some(({ name }) => name === accent);
}

/** A typed colour becomes an accent patch only once it is a complete hex; the `#` is optional. */
export function accentPatch(input: string): Pick<ThemeConfig, "accent"> | null {
  const trimmed = input.trim();
  const hex = normalizeHex(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
  return hex ? { accent: hex } : null;
}
