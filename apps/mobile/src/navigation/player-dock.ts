import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasTabBarAccessory } from "~/lib/platform";
import { sizes, space } from "~/theme/tokens";

/** @deprecated Use `sizes.dock` from `~/theme/tokens`. */
export const FLOATING_DOCK_HEIGHT = sizes.dock;

/** The floating mini player's inset from the screen's side edges: the page gutter. */
export const FLOATING_DOCK_INSET = sizes.page;

/** Space between the floating mini player and the tab bar. */
const DOCK_GAP = space.sm;

/** UITabBar (49pt) and the Material 3 navigation bar (80dp). */
const TAB_BAR_HEIGHT = Platform.select({ ios: 49, default: 80 });

/** Distance from the screen bottom to the floating mini-player. */
export function useFloatingDockOffset(): number {
  return useSafeAreaInsets().bottom + TAB_BAR_HEIGHT + DOCK_GAP;
}

/**
 * Bottom padding a tab screen's scroll content needs so its last row clears
 * the floating mini-player. The tab bar accessory is laid out by the system,
 * which insets the content itself.
 */
export const playerDockInset = hasTabBarAccessory ? 0 : sizes.dock + DOCK_GAP;
