import { Platform } from "react-native";
import type { SearchBarProps } from "react-native-screens";

/**
 * The header search field's fixed options (the screen adds its handlers).
 *
 * Android has no search tab: Search is pushed from the app bar's search
 * action, a tap that means "I want to type", so the field takes focus and
 * opens the keyboard on arrival. On iOS Search is a tab whose root the
 * listener also browses (recent and top searches), and the system decides
 * when its tab-bar field is active, so nothing is forced there.
 */
export function searchBarOptions() {
  return {
    placeholder: "Songs, albums, artists, podcasts",
    autoCapitalize: "none",
    // Read at render, like `hasHeaderLanguages`, so a test can switch platforms.
    autoFocus: Platform.OS === "android",
  } as const satisfies SearchBarProps;
}
