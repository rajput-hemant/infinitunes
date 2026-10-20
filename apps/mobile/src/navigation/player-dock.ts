import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasTabBarAccessory } from "~/lib/platform";

/** Height of the floating mini-player, which sits above the tab bar. */
export const FLOATING_DOCK_HEIGHT = 64;

const DOCK_GAP = 8;

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
export const playerDockInset = hasTabBarAccessory
  ? 0
  : FLOATING_DOCK_HEIGHT + DOCK_GAP;
