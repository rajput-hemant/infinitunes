import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement } from "react";

import { queryClient } from "~/lib/query-client";

type Routes = Record<string, () => ReactElement | null>;

function LibraryStack() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}

/**
 * Renders library screens as routes of an in-memory router inside a native
 * stack (header search and toolbars need one), on the app's own query client
 * (the screens invalidate it directly after a write) emptied first, with no
 * retries and no garbage-collection timers left running.
 */
export function renderLibrary(routes: Routes, initialUrl = "/") {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false, gcTime: Infinity },
  });

  return renderRouter({ _layout: LibraryStack, ...routes }, { initialUrl });
}

/**
 * Picks `event` in the native menu opened by the control labelled `trigger`
 * (a native menu has no tappable items in the test tree).
 */
export async function chooseMenuAction(trigger: string, event: string) {
  await fireEvent(screen.getByLabelText(trigger), "pressAction", {
    nativeEvent: { event },
  });
}
