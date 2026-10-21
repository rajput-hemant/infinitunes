import { Stack } from "expo-router";

import { SettingsScreen } from "~/features/settings/settings-screen";

/** Pushed onto the current tab from the header's Settings button. */
export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <SettingsScreen />
    </>
  );
}
