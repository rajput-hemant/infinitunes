import { router } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";

function SignedOutState({ placement }: Pick<SignedInGateProps, "placement">) {
  return (
    <EmptyState
      placement={placement}
      icon={{ ios: "person.crop.circle", android: "account_circle" }}
      title="Your library lives in your account"
      message="Sign in to like songs, keep playlists and pick up where you left off."
      action={{ label: "Sign in", onPress: () => router.push("/login") }}
    />
  );
}

type SignedInGateProps = {
  children: ReactNode;
  /** `top` inside a sheet (see `EmptyState`). */
  placement?: "center" | "top";
};

/**
 * Shows `children` to a signed-in listener, a way into the sign-in flow to a
 * signed-out one. A cold start reads the stored session first, which must
 * not flash the sign-in prompt at someone who is signed in.
 */
export function SignedInGate({ children, placement }: SignedInGateProps) {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }
  return data ? children : <SignedOutState placement={placement} />;
}
