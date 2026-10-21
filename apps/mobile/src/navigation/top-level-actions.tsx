import { router } from "expo-router";
import { Platform, Pressable, View } from "react-native";

import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { userInitial } from "~/lib/user-initial";
import { maxFontScale } from "~/theme/tokens";

/** The account's initial in a circle (its profile), or Sign In while signed out. */
function ProfileButton() {
  const user = authClient.useSession().data?.user;

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
 * The trailing header of a tab's root screen (Home, Library, Radio): Search
 * (Android only; iOS has the search tab), then Settings and Profile, both
 * pushed onto the current tab. Settings is not a tab of its own. Pass it as
 * the root screen's `headerRight`.
 */
export function TopLevelActions() {
  return <Actions languages={false} />;
}

/** `TopLevelActions` with Home's language picker before Settings. */
export function HomeTopLevelActions() {
  return <Actions languages />;
}

function Actions({ languages }: { languages: boolean }) {
  return (
    <View className="flex-row items-center">
      {Platform.OS === "android" ? (
        <IconButton
          icon={{ ios: "magnifyingglass", android: "search" }}
          label="Search"
          onPress={() => router.push("/search")}
        />
      ) : null}
      {languages ? (
        <IconButton
          icon={{ ios: "globe", android: "language" }}
          label="Languages"
          onPress={() => router.push("/languages")}
        />
      ) : null}
      <IconButton
        icon={{ ios: "gearshape", android: "settings" }}
        label="Settings"
        onPress={() => router.push("/settings")}
      />
      <ProfileButton />
    </View>
  );
}
