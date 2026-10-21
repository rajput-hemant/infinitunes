import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

/** A deep link to a shared entity route in this tab keeps Home below it. */
export const unstable_settings = { initialRouteName: "index" };

export default function HomeLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
