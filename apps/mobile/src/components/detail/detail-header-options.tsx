import type { NativeStackNavigationOptions } from "expo-router";
import { Platform, View } from "react-native";

import { MenuTrigger } from "~/components/menu-trigger";
import { NativeMenu } from "~/components/native-menu";
import type { MenuEntry } from "~/components/native-menu";
import { IconButton } from "~/components/ui/icon-button";
import { hasHeaderBarItems } from "~/lib/platform";
import { shareItem } from "~/lib/share";
import type { ShareableItem } from "~/lib/share";

import type { HeaderMenu } from "./detail-menu";

type HeaderItems = ReturnType<
  NonNullable<NativeStackNavigationOptions["unstable_headerRightItems"]>
>;
type MenuItem = Extract<HeaderItems[number], { type: "menu" }>["menu"]["items"];

/** The same entries as the header's native `UIMenu` items (symbols, checks, submenus). */
function menuItems(entries: readonly MenuEntry[]): MenuItem {
  return entries.map((entry) => {
    const icon =
      typeof entry.image === "string"
        ? { type: "sfSymbol" as const, name: entry.image }
        : undefined;
    return entry.subactions
      ? {
          type: "submenu" as const,
          label: entry.title,
          icon,
          items: menuItems(entry.subactions),
        }
      : {
          type: "action" as const,
          label: entry.title,
          icon,
          state: entry.state,
          disabled: entry.attributes?.disabled,
          onPress: () => entry.run?.(),
        };
  });
}

/**
 * Native header of a detail screen. The entity's own header shows the title
 * under the artwork, so the bar shows none (`title` still names the screen for
 * the back button's menu); Share and, when the page has one, its "more" menu
 * sit at the trailing edge. iOS 26 gets them as native bar items, which the
 * system draws in one glass capsule like Apple Music's, the menu a real
 * `UIMenu`; other platforms get the two buttons in `headerRight` (Android's
 * overflow is `more_vert` after Share). With no item yet (loading, failed)
 * there is neither.
 *
 * Once the page scrolls under the bar (`scrolledColor` set, see
 * `useDetailScrollProps`), the bar shows the item's name, and on Android also
 * takes Material 3's scrolled container colour; both return at the top. Every key is always present: `<Stack.Screen options>` merges into the
 * previous options, so a left-out key would keep the old value.
 */
export function detailHeaderOptions(
  item?: ShareableItem,
  scrolledColor?: string,
  menu?: HeaderMenu,
): NativeStackNavigationOptions {
  const share = item && (() => shareItem(item));
  const scrolled = item !== undefined && scrolledColor;
  const menuLabel = `More actions for ${menu?.title ?? ""}`;
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
            <View className="flex-row items-center">
              <IconButton
                icon={{ ios: "square.and.arrow.up", android: "share" }}
                label={`Share ${item.name}`}
                onPress={share}
              />
              {menu ? (
                <NativeMenu title={menu.title} entries={menu.entries}>
                  <MenuTrigger label={menuLabel} size="lg" />
                </NativeMenu>
              ) : null}
            </View>
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
                  ...(menu
                    ? [
                        {
                          type: "menu" as const,
                          label: menuLabel,
                          accessibilityLabel: menuLabel,
                          icon: {
                            type: "sfSymbol" as const,
                            name: "ellipsis" as const,
                          },
                          menu: {
                            title: menu.title,
                            items: menuItems(menu.entries),
                          },
                        },
                      ]
                    : []),
                ]
              : undefined,
        }
      : {}),
  };
}
