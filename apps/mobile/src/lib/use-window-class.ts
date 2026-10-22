import { useWindowDimensions } from "react-native";

/**
 * Material's window size classes by width: a phone in portrait is `compact`,
 * a phone in landscape, a foldable's inner screen or an iPad in split view
 * `medium`, a tablet `expanded`. Layouts pick columns from it, not from the
 * device.
 */
export type WindowClass = "compact" | "medium" | "expanded";

/** Where `medium` and `expanded` start, in dp/pt. */
export const WINDOW_BREAKPOINTS = { medium: 600, expanded: 840 } as const;

export function windowClassOf(width: number): WindowClass {
  if (width >= WINDOW_BREAKPOINTS.expanded) return "expanded";
  if (width >= WINDOW_BREAKPOINTS.medium) return "medium";
  return "compact";
}

/** The current window's class; it changes on rotation, resize and fold. */
export function useWindowClass(): WindowClass {
  return windowClassOf(useWindowDimensions().width);
}
