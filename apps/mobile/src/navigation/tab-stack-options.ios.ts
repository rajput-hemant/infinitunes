import type { NativeStackNavigationOptions } from "expo-router";

import { hasLiquidGlass } from "~/lib/platform";

/**
 * Every screen of a tab: a large title that collapses into a transparent
 * header. On iOS 26 content scrolling under the header (and the tab bar)
 * fades through a soft, progressive blur (`UIScrollEdgeEffect` `soft`): the
 * strongest at the edge, less and less towards the content. Earlier versions
 * need an explicit blur material behind the header instead.
 */
export const tabStackOptions: NativeStackNavigationOptions = {
  headerLargeTitle: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  ...(hasLiquidGlass
    ? { scrollEdgeEffects: { top: "soft", bottom: "soft" } }
    : { headerBlurEffect: "systemChromeMaterial" }),
};
