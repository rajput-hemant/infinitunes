import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

/** A deep link to a shared entity route in this tab keeps Library below it. */
export const unstable_settings = { initialRouteName: "library" };

export default function LibraryLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="library" options={{ title: "Library" }} />
    </Stack>
  );
}
