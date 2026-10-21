import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="password" options={{ title: "Change password" }} />
      <Stack.Screen
        name="delete-account"
        options={{ title: "Delete account" }}
      />
    </Stack>
  );
}
