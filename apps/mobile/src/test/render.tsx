import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement } from "react";

/**
 * Renders `ui` as the only screen of an in-memory router (links and
 * `useTheme` need one), inside a fresh query cache.
 */
export function renderScreen(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderRouter({
    index: () => (
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  });
}
