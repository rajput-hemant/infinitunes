import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";

import { FloatingPlayerDock } from "~/features/player/floating-player-dock";
import { MiniPlayer } from "~/features/player/mini-player";
import { hasTabBarAccessory } from "~/lib/platform";
import { openCreatePlaylist } from "~/navigation/create-playlist";
import { useUserId } from "~/user-data/session";

/**
 * Platform tab bars (UITabBarController, Material 3 navigation bar) with the
 * system materials: no colours are set here, so iOS 26 keeps Liquid Glass and
 * Android its Material You surface. Each tab owns a stack, so pushed screens
 * keep the tab bar; Settings and Profile are pushed onto the current tab from
 * the root screens' headers (`TopLevelActions`).
 *
 * Create is an action, not a screen. NativeTabs' `tabPress` cannot be
 * prevented (`canPreventDefault: false`), so the trigger is `disabled`: the
 * native bar refuses the selection (`preventNativeSelection`, which does not
 * dim the item), the selected tab stays where it was, and the navigator still
 * emits `tabPress`, which opens the New Playlist sheet. `disabled` only stops
 * taps, so the `create` route exists; if JS navigation ever focuses it, it
 * leaves again and opens the sheet (`create.tsx`), and `/create` links are
 * rewritten to `/create-playlist` (`+native-intent`).
 *
 * Search is the iOS search tab (`role="search"`: iOS 26's separate trailing
 * button, a plain fifth tab before it). Android has no search tab: the root
 * screens' app bar has a search action that pushes `/search` onto the current
 * tab, and `+native-intent` sends `/search` links to Home's stack there.
 */
export default function TabsLayout() {
  const userId = useUserId();

  return (
    <>
      <NativeTabs minimizeBehavior="onScrollDown">
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
        <NativeTabs.Trigger name="(library)">
          <NativeTabs.Trigger.Icon
            sf={{ default: "square.stack", selected: "square.stack.fill" }}
            md="library_music"
          />
          <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="create"
          disabled
          accessibilityLabel="Create playlist"
          listeners={{ tabPress: () => openCreatePlaylist(userId) }}
        >
          <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
          <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(radio)">
          <NativeTabs.Trigger.Icon
            sf={{ default: "radio", selected: "radio.fill" }}
            md="radio"
          />
          <NativeTabs.Trigger.Label>Radio</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        {Platform.OS === "ios" ? (
          <NativeTabs.Trigger name="(search)" role="search">
            <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
            <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ) : null}
      </NativeTabs>
      {hasTabBarAccessory ? null : <FloatingPlayerDock />}
    </>
  );
}
