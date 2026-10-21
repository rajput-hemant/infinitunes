import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

/** A deep link to a shared entity route in this tab keeps Search below it. */
export const unstable_settings = { initialRouteName: "search" };

export default function SearchLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="search" options={{ title: "Search" }} />
    </Stack>
  );
}
