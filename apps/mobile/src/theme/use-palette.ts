import { useColorScheme } from "react-native";

import { paletteFor } from "./android-colors";
import type { Palette } from "./tokens";

/**
 * The token palette of the current colour scheme, for the few props that take
 * a colour instead of a class (a placeholder, an icon tint). On Android 12+ it
 * holds the Material You roles the classes resolve to. Prefer semantic classes.
 */
export function usePalette(): Palette {
  return paletteFor(useColorScheme() === "dark" ? "dark" : "light");
}
