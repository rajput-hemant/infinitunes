import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform } from "react-native";

/**
 * iOS 26+ with Liquid Glass enabled. Glass surfaces and headers fall back to
 * blur materials below it, or when the app runs in UIKit compatibility mode.
 */
export const hasLiquidGlass = isLiquidGlassAvailable();

/**
 * UITabBarController's bottom accessory (the system mini-player slot) exists
 * from iOS 26. Everywhere else the mini-player floats above the tab bar.
 */
export const hasTabBarAccessory =
  Platform.OS === "ios" && Number.parseInt(Platform.Version, 10) >= 26;

/**
 * Native header bar items (separate glass buttons) exist from iOS 26 too.
 * @alias of `hasTabBarAccessory`, kept apart because the two may diverge.
 */
export const hasHeaderBarItems = hasTabBarAccessory;
