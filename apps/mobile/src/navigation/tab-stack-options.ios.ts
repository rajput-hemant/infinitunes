import type { NativeStackNavigationOptions } from "expo-router";

import { hasLiquidGlass } from "~/lib/platform";

/**
 * Root screens of a tab: a large title that collapses into a transparent
 * header. iOS 26 gives that header its glass scroll edge; earlier versions
 * need an explicit blur material behind it.
 */
export const tabStackOptions: NativeStackNavigationOptions = {
  headerLargeTitle: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  ...(hasLiquidGlass ? {} : { headerBlurEffect: "systemChromeMaterial" }),
};
