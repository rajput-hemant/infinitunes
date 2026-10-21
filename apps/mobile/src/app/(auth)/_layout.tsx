import { Redirect, Stack } from "expo-router";

import { authClient } from "~/lib/auth-client";

/**
 * Sign-in flow, presented modally over the tabs (see the root layout). A
 * listener with a session has no business here, which also closes the flow
 * once a sign-in or sign-up succeeds (the web's proxy redirects the same way).
 */
export default function AuthLayout() {
  const { data: session } = authClient.useSession();
  if (session) return <Redirect href="/" />;

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
