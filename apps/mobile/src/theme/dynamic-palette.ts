import { androidDynamicColors, COLOR_TOKENS } from "./tokens";
import type { M3Role, Palette } from "./tokens";

/** Supporting text's share of the text colour when the system gives it none of its own. */
const SUPPORTING_ALPHA = 0.72;

/** `#rrggbb` at `alpha`, or undefined for any other notation. */
function withAlpha(hex: string, alpha: number): string | undefined {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return undefined;
  const [r, g, b] = match.slice(1).map((pair) => Number.parseInt(pair, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  // One UI resolves onSurfaceVariant to onSurface itself (#fcfcff on a dark
  // Samsung), which leaves supporting text as loud as titles: fade it instead.
  if (
    palette["muted-foreground"].toLowerCase() ===
    palette.foreground.toLowerCase()
  ) {
    palette["muted-foreground"] =
      withAlpha(palette.foreground, SUPPORTING_ALPHA) ??
      base["muted-foreground"];
  }
  return palette;
}

/** A palette as the CSS variables the colour classes read (`--background`), for `vars()`. */
export function toVariables(palette: Palette): Record<`--${string}`, string> {
  return Object.fromEntries(
    COLOR_TOKENS.map((token) => [`--${token}`, palette[token]]),
  );
}
