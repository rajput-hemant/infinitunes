import { colors } from "./tokens";
import type { ColorScheme, Palette } from "./tokens";

/**
 * iOS resolves colour classes to UIKit system colours at build time
 * (`tailwind.config.ts`); JS colours read the palette. Android's version
 * swaps in Material You roles (`android-colors.android.ts`).
 */
export function paletteFor(scheme: ColorScheme): Palette {
  return colors[scheme];
}

/** Nothing to install outside Android. */
export function installDynamicColors() {}
