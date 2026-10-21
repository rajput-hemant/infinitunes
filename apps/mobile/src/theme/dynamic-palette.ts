import { androidDynamicColors, COLOR_TOKENS } from "./tokens";
import type { ColorScheme, M3Role, Palette } from "./tokens";

/**
 * `base` with every token that has a Material 3 role (`androidDynamicColors`)
 * replaced by that role's colour. A role the platform cannot resolve keeps
 * the palette value, and the alpha tokens (`fill*`, `scrim`) always do.
 */
export function withDynamicRoles(
  base: Palette,
  resolve: (role: M3Role) => unknown,
): Palette {
  const palette = { ...base };
  for (const token of COLOR_TOKENS) {
    const role = androidDynamicColors[token];
    const value = role ? resolve(role) : undefined;
    if (typeof value === "string") palette[token] = value;
  }
  return palette;
}

/** A palette as NativeWind root variables for one scheme (`--background`). */
export function toRootVariables(
  palette: Palette,
  scheme: ColorScheme,
): Record<string, Partial<Record<ColorScheme, string>>> {
  return Object.fromEntries(
    COLOR_TOKENS.map((token) => [`--${token}`, { [scheme]: palette[token] }]),
  );
}
