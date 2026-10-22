import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";
import { useTopLevelHeaderOptions } from "~/navigation/top-level-actions";

/** A deep link to a shared entity route in this tab keeps Library below it. */
export const unstable_settings = { anchor: "library" };

export default function LibraryLayout() {
  const headerOptions = useTopLevelHeaderOptions("Library");
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="library" options={headerOptions} />
    </Stack>
  );
}
