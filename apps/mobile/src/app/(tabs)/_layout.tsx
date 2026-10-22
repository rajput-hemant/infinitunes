import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";

import { FloatingPlayerDock } from "~/features/player/floating-player-dock";
import { MiniPlayer } from "~/features/player/mini-player";
import { hasTabBarAccessory } from "~/lib/platform";
import { useQuickActionRouting } from "~/navigation/use-quick-action-routing";
import { useTabAccent } from "~/theme/use-palette";

/** Material 3's navigation bar labels are label medium (12/500); UITabBar's are 10pt. */
const TAB_LABEL = Platform.select({
  android: { fontSize: 12, fontWeight: "500" },
  default: { fontSize: 10 },
} as const);

/**
 * Platform tab bars (UITabBarController, Material 3 navigation bar) with the
 * system materials: no colours are set here, so iOS 26 keeps Liquid Glass and
 * Android its Material You surface. Each tab owns a stack, so pushed screens
 * keep the tab bar; Settings and Profile are pushed onto the current tab from
 * the root screens' headers (`TopLevelActions`).
 *
 * Tab order is Home, Radio, Search, Library. New Playlist is a row in Library
 * (and the `/create` link opens its sheet, see `+native-intent`).
 *
 * Search is a plain tab on iOS (not `role="search"`, which iOS 26 pins as a
 * separate trailing button and would put it after Library). Android has no
 * search tab: the root screens' app bar has a search action that pushes
 * `/search` onto the current tab, and `+native-intent` sends `/search` links
 * to Home's stack there.
 */
export default function TabsLayout() {
  const tint = useTabAccent();
  // iOS icon long-press: navigates to the item's `params.href` (plugins/ios-quick-actions.ts).
  useQuickActionRouting();

  return (
    <>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        tintColor={tint}
        indicatorColor={tint ? `${tint}33` : undefined}
        labelStyle={TAB_LABEL}
        labelVisibilityMode="labeled"
      >
        {hasTabBarAccessory ? (
          <NativeTabs.BottomAccessory>
            <MiniPlayer />
          </NativeTabs.BottomAccessory>
        ) : null}
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
            md="home"
          />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(radio)">
          <NativeTabs.Trigger.Icon
            sf="dot.radiowaves.left.and.right"
            md="radio"
          />
          <NativeTabs.Trigger.Label>Radio</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        {Platform.OS === "ios" ? (
          <NativeTabs.Trigger name="(search)">
            <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
            <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ) : null}
        <NativeTabs.Trigger name="(library)">
          <NativeTabs.Trigger.Icon
            sf={{ default: "books.vertical", selected: "books.vertical.fill" }}
            md="library_music"
          />
          <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      {hasTabBarAccessory ? null : <FloatingPlayerDock />}
    </>
  );
}
