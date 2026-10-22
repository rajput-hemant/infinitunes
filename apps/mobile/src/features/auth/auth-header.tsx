import { router } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router";
import { Platform } from "react-native";

import { IconButton } from "~/components/ui/icon-button";
import { hasHeaderBarItems } from "~/lib/platform";

/**
 * Leaves the sign-in flow for the screen that opened it, or Home when a link
 * opened it cold (nothing under the modal).
 */
export function closeAuth() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/**
 * The sign-in screens' bar. Android shows no title (the screen's own heading
 * says it; `title` still names it for TalkBack and the back button). On iOS
 * the flow's first screen (sign in, or a reset link opened cold) gets Close:
 * the modal's root has no Back. Later screens keep Back.
 */
export function authHeaderOptions(root: boolean): NativeStackNavigationOptions {
  if (Platform.OS === "android") return { headerTitle: "" };
  if (!root) return {};
  return {
    headerRight: () => (
      <IconButton
        icon={{ ios: "xmark", android: "close" }}
        label="Close"
        onPress={closeAuth}
      />
    ),
    ...(hasHeaderBarItems
      ? {
          unstable_headerRightItems: () => [
            {
              type: "button" as const,
              label: "Close",
              icon: { type: "sfSymbol" as const, name: "xmark" as const },
              onPress: closeAuth,
            },
          ],
        }
      : {}),
  };
}
