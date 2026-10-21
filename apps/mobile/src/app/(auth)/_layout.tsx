import { Redirect, router, Stack } from "expo-router";
import { useEffect, useState } from "react";

import { authClient } from "~/lib/auth-client";

/**
 * Sign-in flow, presented modally over the tabs (see the root layout). A
 * listener with a session has no business here:
 * - one who signs in here gets the modal dismissed, which reveals the screen
 *   that asked for the account (an album's like button, Settings); a redirect
 *   to a route would land on Home instead;
 * - one who already had a session when a link opened the flow is redirected
 *   Home, as the web's proxy does (the imperative router is not ready yet).
 */
export default function AuthLayout() {
  const { data: session } = authClient.useSession();
  const signedIn = Boolean(session);
  const [openedSignedIn] = useState(signedIn);

  useEffect(() => {
    if (!signedIn || openedSignedIn) return;
    if (router.canDismiss()) router.dismissAll();
    else router.replace("/");
  }, [signedIn, openedSignedIn]);

  if (signedIn && openedSignedIn) return <Redirect href="/" />;
  if (signedIn) return null;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="signup" options={{ title: "Create account" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Reset password" }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ title: "Choose a new password" }}
      />
    </Stack>
  );
}
