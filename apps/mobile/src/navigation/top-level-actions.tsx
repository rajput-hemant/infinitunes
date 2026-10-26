import { router } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router";
import { Pressable, View } from "react-native";

import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { hasHeaderBarItems } from "~/lib/platform";
import { userInitial } from "~/lib/user-initial";
import { maxFontScale } from "~/theme/tokens";

/** The account's initial in a circle (its profile), or Sign In while signed out. */
function ProfileButton() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  // A cold start reads the stored session first: no "Sign in" flash for a
  // signed-in listener (whose tap would open /login and bounce back to Home).
  if (isPending) return <View className="size-touch" />;

  if (!user) {
    return (
      <IconButton
        icon={{ ios: "person.crop.circle", android: "account_circle" }}
        label="Sign in"
        onPress={() => router.push("/login")}
      />
    );
  }
  return (
    <Pressable
      onPress={() => router.push("/profile")}
      accessibilityRole="button"
      accessibilityLabel="Profile"
      className="min-h-touch min-w-touch items-center justify-center active:opacity-60"
    >
      <View className="size-8 items-center justify-center rounded-full bg-secondary">
        <Text
          variant="subhead"
          tone="onSecondary"
          maxFontSizeMultiplier={maxFontScale.chrome}
        >
          {userInitial(user)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * The trailing header of a tab's root screen (Home, Library, Radio): Settings
 * and Profile, both pushed onto the current tab. Settings is not a tab of its own. Languages
 * lives in Settings only. Pass it as the root screen's `headerRight`.
 */
export function TopLevelActions() {
  return (
    <View className="flex-row items-center">
      <IconButton
        icon={{ ios: "gearshape", android: "settings" }}
        label="Settings"
        onPress={() => router.push("/settings")}
      />
      <ProfileButton />
    </View>
  );
}

/**
 * The root screens' header options. iOS uses native items that share one glass
 * capsule (the system default), with the page title as a leading item (Apple
 * Music's layout: title left, actions right on one row).
 * Other platforms keep the view and the system title. A hook: the profile
 * button follows the session.
 */
export function useTopLevelHeaderOptions(
  title: string,
): Pick<
  NativeStackNavigationOptions,
  | "title"
  | "headerRight"
  | "headerLargeTitle"
  | "headerTitle"
  | "unstable_headerLeftItems"
  | "unstable_headerRightItems"
> {
  const { data, isPending } = authClient.useSession();
  const signedIn = Boolean(data?.user);

  if (!hasHeaderBarItems) return { title, headerRight: TopLevelActions };

  return {
    title,
    headerRight: TopLevelActions,
    headerLargeTitle: false,
    headerTitle: "",
    unstable_headerLeftItems: () => [
      {
        type: "custom" as const,
        element: (
          // Home's title is the greeting with a name: one line, shrunk to fit.
          <Text
            variant="largeTitle"
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {title}
          </Text>
        ),
        hidesSharedBackground: true,
      },
    ],
    unstable_headerRightItems: () => [
      {
        type: "button" as const,
        label: "Settings",
        icon: { type: "sfSymbol" as const, name: "gearshape" as const },
        onPress: () => router.push("/settings"),
      },
      // A cold start reads the stored session first: no Sign in flash.
      ...(isPending
        ? []
        : [
            {
              type: "button" as const,
              label: signedIn ? "Profile" : "Sign in",
              icon: {
                type: "sfSymbol" as const,
                name: signedIn
                  ? ("person.crop.circle.fill" as const)
                  : ("person.crop.circle" as const),
              },
              onPress: () => router.push(signedIn ? "/profile" : "/login"),
            },
          ]),
    ],
  };
}
