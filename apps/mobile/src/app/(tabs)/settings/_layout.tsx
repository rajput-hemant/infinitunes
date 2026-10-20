import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
    </Stack>
  );
}
