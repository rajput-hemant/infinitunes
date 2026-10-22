import type { NativeStackNavigationOptions } from "expo-router";
import { Platform } from "react-native";

import { IconButton } from "~/components/ui/icon-button";
import { hasHeaderBarItems } from "~/lib/platform";
import { shareItem } from "~/lib/share";
import type { ShareableItem } from "~/lib/share";

/**
 * Native header of a detail screen. The entity's own header shows the title
 * under the artwork, so the bar shows none (`title` still names the screen for
 * the back button's menu); Share sits at its trailing edge. iOS 26 gets it as a
 * native bar button, the same round glass as the back button; a custom view
 * would sit in a wider capsule. With no item yet (loading, failed) there is no
 * Share.
 *
 * Once the page scrolls under the bar (`scrolledColor` set, see
 * `useDetailScrollProps`), the bar shows the item's name, and on Android also
 * takes Material 3's scrolled container colour; both return at the top. Every key is always present: `<Stack.Screen options>` merges into the
 * previous options, so a left-out key would keep the old value.
 */
export function detailHeaderOptions(
  item?: ShareableItem,
  scrolledColor?: string,
): NativeStackNavigationOptions {
  const share = item && (() => shareItem(item));
  const scrolled = item !== undefined && scrolledColor;
  return {
    title: item?.name ?? "",
    headerTitle: scrolled ? item.name : "",
    headerLargeTitle: false,
    ...(Platform.OS === "android"
      ? {
          headerStyle: scrolled
            ? { backgroundColor: scrolledColor }
            : undefined,
        }
      : {}),
    headerRight:
      item && share
        ? () => (
            <IconButton
              icon={{ ios: "square.and.arrow.up", android: "share" }}
              label={`Share ${item.name}`}
              onPress={share}
            />
          )
        : undefined,
    ...(hasHeaderBarItems
      ? {
          unstable_headerRightItems:
            item && share
              ? () => [
                  {
                    type: "button" as const,
                    label: `Share ${item.name}`,
                    icon: {
                      type: "sfSymbol" as const,
                      name: "square.and.arrow.up" as const,
                    },
                    onPress: share,
                  },
                ]
              : undefined,
        }
      : {}),
  };
}
