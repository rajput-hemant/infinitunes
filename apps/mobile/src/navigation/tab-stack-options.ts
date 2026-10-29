import type { NativeStackNavigationOptions } from "expo-router";

/**
 * Root screens of a tab: a flat Material 3 top app bar in the surface
 * colour, which the navigation theme provides.
 */
export function tabStackOptions({
  route,
}: {
  route: { name: string };
}): NativeStackNavigationOptions {
  return {
    headerShadowVisible: false,
    // Never let native-stack fall back to a file-system route as its title.
    title: "",
    ...(route.name.includes("[token]")
      ? {
          headerTransparent: true,
          headerLargeTitle: false,
          headerTitle: "",
          // The scroll-driven BarScrim replaces this after the screen mounts.
          headerBackground: () => null,
        }
      : {}),
  };
}
