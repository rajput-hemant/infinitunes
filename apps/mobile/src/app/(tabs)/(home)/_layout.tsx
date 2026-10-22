import { Stack } from "expo-router";

import { useHomeGreeting } from "~/features/home/home-header";
import { tabStackOptions } from "~/navigation/tab-stack-options";
import { useTopLevelHeaderOptions } from "~/navigation/top-level-actions";

/** A deep link to a shared entity route in this tab keeps Home below it. */
export const unstable_settings = { anchor: "index" };

/** The title is the greeting ("Good evening, Asha"); the tab itself is still Home. */
export default function HomeLayout() {
  const headerOptions = useTopLevelHeaderOptions(useHomeGreeting());
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={headerOptions} />
    </Stack>
  );
}
