import { ACCENT_TOKENS, accentColors } from "./tokens";
import type { AccentId, ColorScheme, ColorToken, Palette } from "./tokens";

/** The colour class variables an accent replaces (`ThemeRoot`). */
export const ACCENTED_TOKENS: readonly ColorToken[] = ACCENT_TOKENS;

/**
 * `base` under the listener's accent. Here (iOS) the accent recolours
 * `primary` and its text only: every other token stays a UIKit system colour.
 */
export function withAccent(
  base: Palette,
  accent: AccentId,
  scheme: ColorScheme,
): Palette {
  const preset = accentColors(accent, scheme);
  return preset
    ? {
        ...base,
        primary: preset.primary,
        "primary-foreground": preset.foreground,
      }
    : base;
}
