import { router } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { authClient } from "~/lib/auth-client";

function SignedOutState() {
  return (
    <EmptyState
      icon={{ ios: "person.crop.circle", android: "account_circle" }}
      title="Your library lives in your account"
      message="Sign in to like songs, keep playlists and pick up where you left off."
      action={{ label: "Sign in", onPress: () => router.push("/login") }}
    />
  );
}

/**
 * Shows `children` to a signed-in listener, a way into the sign-in flow to a
 * signed-out one. A cold start reads the stored session first, which must
 * not flash the sign-in prompt at someone who is signed in.
 */
export function SignedInGate({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  return data ? children : <SignedOutState />;
}
