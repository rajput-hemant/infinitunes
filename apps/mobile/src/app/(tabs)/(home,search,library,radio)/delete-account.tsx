import { Stack } from "expo-router";

import { DeleteAccountForm } from "~/features/settings/delete-account-form";
import { RequireSession } from "~/features/settings/require-session";

export default function DeleteAccountScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Delete account" }} />
      <RequireSession>{() => <DeleteAccountForm />}</RequireSession>
    </>
  );
}
