import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

export default function HomeLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
