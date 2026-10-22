import type * as Material from "@material/material-color-utilities";

import { withDynamicRoles } from "./dynamic-palette";
import { ACCENTS, COLOR_TOKENS, colors } from "./tokens";
import type { AccentId, ColorScheme, ColorToken, Palette } from "./tokens";

/** The colour class variables an accent replaces (`ThemeRoot`): all of them. */
export const ACCENTED_TOKENS: readonly ColorToken[] = COLOR_TOKENS;

const cache = new Map<`${AccentId}:${ColorScheme}`, Palette>();

/**
 * `base` under the listener's accent. Here (Android) the accent is the seed
 * of a whole Material You scheme (tonal spot, the variant the system builds
 * from a wallpaper, at standard contrast and the default spec, as the
 * player's wash), so containers and their text follow it instead of the
 * wallpaper. One seed (the light preset) serves both schemes, so light and
 * dark are the same family; the alpha tokens keep the palette's values.
 */
export function withAccent(
  base: Palette,
  accent: AccentId,
  scheme: ColorScheme,
): Palette {
  const preset = ACCENTS[accent];
  if (!preset) return base;
  const key = `${accent}:${scheme}` as const;
  const cached = cache.get(key);
  if (cached) return cached;
  // Loaded on first use: only listeners who pick an accent evaluate it.
  // oxlint-disable-next-line typescript/no-require-imports
  const { argbFromHex, Hct, hexFromArgb, SchemeTonalSpot } =
    require("@material/material-color-utilities") as typeof Material;
  const roles = new SchemeTonalSpot(
    Hct.fromInt(argbFromHex(preset.light)),
    scheme === "dark",
    0,
  );
  // Every role we map is a DynamicScheme getter (an ARGB number).
  const palette = withDynamicRoles(colors[scheme], (role) =>
    hexFromArgb(Reflect.get(roles, role) as number),
  );
  cache.set(key, palette);
  return palette;
}
