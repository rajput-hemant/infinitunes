import { Stack } from "expo-router";

import { authClient } from "~/lib/auth-client";
import { tabStackOptions } from "~/navigation/tab-stack-options";
import { useTopLevelHeaderOptions } from "~/navigation/top-level-actions";

/** A deep link to a shared entity route in this tab keeps Library below it. */
export const unstable_settings = { anchor: "library" };

/** Android draws the title in the page (`PageTitle`) once the library shows; signed out the bar keeps it. */
export default function LibraryLayout() {
  const { data } = authClient.useSession();
  const headerOptions = useTopLevelHeaderOptions("Library", {
    titleInPage: Boolean(data?.user),
  });
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="library" options={headerOptions} />
    </Stack>
  );
}
