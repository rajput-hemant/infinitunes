import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";
import { TopLevelActions } from "~/navigation/top-level-actions";

/** A deep link to a shared entity route in this tab keeps Library below it. */
export const unstable_settings = { anchor: "library" };

export default function LibraryLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen
        name="library"
        options={{ title: "Library", headerRight: TopLevelActions }}
      />
    </Stack>
  );
}
