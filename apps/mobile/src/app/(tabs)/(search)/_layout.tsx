import { Stack } from "expo-router";

import { tabStackOptions } from "~/navigation/tab-stack-options";

/**
 * The Search tab. Its root is the shared `search` route; a deep link to an entity here keeps
 * Search below it.
 */
export const unstable_settings = { anchor: "search" };

export default function SearchLayout() {
  return <Stack screenOptions={tabStackOptions} />;
}
