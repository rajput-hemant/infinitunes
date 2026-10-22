import { useCornerStyle } from "./appearance";
import { scaledRadii } from "./tokens";

/** `radii` scaled by the listener's corner style, for the few props that take a number. */
export function useRadii() {
  return scaledRadii(useCornerStyle());
}
