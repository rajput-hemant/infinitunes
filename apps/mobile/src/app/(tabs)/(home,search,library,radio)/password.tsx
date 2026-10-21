import { Stack } from "expo-router";

import { PasswordForm } from "~/features/settings/password-form";
import { RequireSession } from "~/features/settings/require-session";

export default function PasswordScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Change password" }} />
      <RequireSession>{() => <PasswordForm />}</RequireSession>
    </>
  );
}
