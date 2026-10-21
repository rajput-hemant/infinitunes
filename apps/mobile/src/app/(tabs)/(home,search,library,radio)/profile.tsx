import { Stack } from "expo-router";

import { ProfileForm } from "~/features/settings/profile-form";
import { RequireSession } from "~/features/settings/require-session";

/** Pushed onto the current tab from the header's Profile button or Settings. */
export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Profile" }} />
      <RequireSession>{(user) => <ProfileForm user={user} />}</RequireSession>
    </>
  );
}
