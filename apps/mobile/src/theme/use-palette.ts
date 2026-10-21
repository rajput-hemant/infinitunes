import { useColorScheme } from "react-native";

import { colors } from "./tokens";
import type { Palette } from "./tokens";

/**
 * The token palette of the current colour scheme, for the few props that take
 * a colour instead of a class (a placeholder). Prefer semantic classes.
 */
export function usePalette(): Palette {
  return colors[useColorScheme() === "dark" ? "dark" : "light"];
}
