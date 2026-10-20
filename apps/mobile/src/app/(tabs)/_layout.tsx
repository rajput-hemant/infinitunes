import { NativeTabs } from "expo-router/native-tabs";

import { FloatingPlayerDock } from "~/features/player/floating-player-dock";
import { MiniPlayer } from "~/features/player/mini-player";
import { hasTabBarAccessory } from "~/lib/platform";

/**
 * Platform tab bars (UITabBarController, Material 3 navigation bar) with the
 * system materials: no colours are set here, so iOS 26 keeps Liquid Glass and
 * Android its Material You surface. The search tab takes the iOS 26 search
 * role (the separate trailing search button). Each tab owns a stack, so
 * pushed screens keep the tab bar.
 */
export default function TabsLayout() {
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
        <NativeTabs.Trigger name="search" role="search">
          <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
          <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="library">
          <NativeTabs.Trigger.Icon
            sf={{ default: "square.stack", selected: "square.stack.fill" }}
            md="library_music"
          />
          <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            md="settings"
          />
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      {hasTabBarAccessory ? null : <FloatingPlayerDock />}
    </>
  );
}
