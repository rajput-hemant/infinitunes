import { Platform } from "react-native";
import type { SearchBarProps } from "react-native-screens";

/**
 * The header search field's fixed options (the screen adds its handlers).
 *
 * Android's Search tab means "I want to type", so the field takes focus and
 * opens the keyboard on arrival. On iOS the tab's root is also browsed (recent
 * and top searches), so focus is not forced there.
 */
export function searchBarOptions() {
  return {
    placeholder: "Songs, albums, artists, podcasts",
    autoCapitalize: "none",
    // Read at render, like `hasHeaderLanguages`, so a test can switch platforms.
    autoFocus: Platform.OS === "android",
    // Keep the field visible without scrolling.
    hideWhenScrolling: false,
  } as const satisfies SearchBarProps;
}
