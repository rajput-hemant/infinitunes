import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";
import { TopLevelActions } from "~/navigation/top-level-actions";

/** A deep link to a station in this tab keeps the station list below it. */
export const unstable_settings = { anchor: "radio/index" };

export default function RadioLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen
        name="radio/index"
        options={{ title: "Radio", headerRight: TopLevelActions }}
      />
    </Stack>
  );
}
