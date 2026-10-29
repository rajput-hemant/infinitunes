import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasTabBarAccessory } from "~/lib/platform";
import { sizes, space } from "~/theme/tokens";

/**
 * Android's dock is an edge-to-edge strip fused to the top of the navigation
 * bar; iOS before 26 keeps a floating capsule. Read at load (tests re-require).
 */
const STRIP = Platform.OS === "android";

/** The mini player's inset from the screen's side edges: the page gutter, none for the strip. */
export const FLOATING_DOCK_INSET = STRIP ? 0 : sizes.page;

/** Space between the mini player and the tab bar: none for the strip. */
const DOCK_GAP = STRIP ? 0 : space.sm;

/** UITabBar (49pt) and the Material 3 navigation bar (80dp). */
const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 80;

/** Distance from the screen bottom to the mini player. */
export function useFloatingDockOffset(): number {
  return useSafeAreaInsets().bottom + TAB_BAR_HEIGHT + DOCK_GAP;
}

/**
 * Bottom padding a tab screen's scroll content needs so its last row clears
 * the floating mini-player. The tab bar accessory is laid out by the system,
 * which insets the content itself.
 */
export const playerDockInset = hasTabBarAccessory ? 0 : sizes.dock + DOCK_GAP;
