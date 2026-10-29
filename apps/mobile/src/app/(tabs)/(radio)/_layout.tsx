import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";
import { useTopLevelHeaderOptions } from "~/navigation/top-level-actions";

/** A deep link to a station in this tab keeps the station list below it. */
export const unstable_settings = { anchor: "radio/index" };

/** Android draws the title in the page (`PageTitle`), not the bar. */
export default function RadioLayout() {
  const headerOptions = useTopLevelHeaderOptions("Radio", {
    titleInPage: true,
  });
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="radio/index" options={headerOptions} />
    </Stack>
  );
}
