import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { queryClient as appQueryClient } from "~/lib/query-client";

/** No retries, and no garbage-collection timers left running after a test. */
const TEST_QUERY_DEFAULTS = { queries: { retry: false, gcTime: Infinity } };

/** What `AppProviders` gives every screen: gesture root and a query cache. */
function TestRoot({
  client,
  children,
}: {
  client: QueryClient;
  children: ReactNode;
}) {
  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/** Renders `ui` with the app's theme and a fresh query cache, outside a router. */
export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: TEST_QUERY_DEFAULTS });
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider value={DefaultTheme}>
        <TestRoot client={client}>{children}</TestRoot>
      </ThemeProvider>
    ),
  });
}

type ScreenOptions = {
  /** The URL the router starts at; `ui` is the index route (`/`). */
  initialUrl?: string;
  /** Other routes the screen can navigate to, as `renderRouter` files. */
  routes?: Record<string, ComponentType>;
};

/**
 * Renders `ui` as the index screen of an in-memory router (links and
 * `useTheme` need one), inside a fresh query cache.
 */
export function renderScreen(
  ui: ReactElement,
  { initialUrl = "/", routes = {} }: ScreenOptions = {},
) {
  const client = new QueryClient({ defaultOptions: TEST_QUERY_DEFAULTS });
  return renderRouter(
    { index: () => <TestRoot client={client}>{ui}</TestRoot>, ...routes },
    { initialUrl },
  );
}

function AppStack() {
  return (
    <TestRoot client={appQueryClient}>
      <Stack />
    </TestRoot>
  );
}

/**
 * Renders screens as routes of an in-memory router inside a native stack
 * (header search and toolbars need one), on the app's own query client (the
 * user-data writes update it directly), emptied first.
 */
export function renderStack(
  routes: Record<string, ComponentType>,
  initialUrl = "/",
) {
  appQueryClient.clear();
  appQueryClient.setDefaultOptions(TEST_QUERY_DEFAULTS);
  return renderRouter({ _layout: AppStack, ...routes }, { initialUrl });
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
