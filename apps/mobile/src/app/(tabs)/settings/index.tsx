import { Link } from "expo-router";
import { ActivityIndicator } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";

export default function SettingsScreen() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <ScreenScrollView contentContainerClassName="gap-4 px-page">
      {isPending ? (
        <ActivityIndicator />
      ) : session ? (
        <>
          <Text tone="muted">Signed in as {session.user.email}</Text>
          <Button label="Sign out" onPress={() => void authClient.signOut()} />
        </>
      ) : (
        <Link href="/login" asChild>
          <Button label="Sign in" />
        </Link>
      )}
    </ScreenScrollView>
  );
}
