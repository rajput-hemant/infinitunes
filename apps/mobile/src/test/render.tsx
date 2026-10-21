import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import { DefaultTheme, ThemeProvider } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement, ReactNode } from "react";

/** No retries, and no garbage-collection timers left running after a test. */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

/** Renders `ui` with the app's theme and a fresh query cache, outside a router. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  function Providers({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider value={DefaultTheme}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    );
  }
  return render(ui, { wrapper: Providers });
}

/**
 * Renders `ui` as the only screen of an in-memory router (links and
 * `useTheme` need one), inside a fresh query cache.
 */
export function renderScreen(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  return renderRouter({
    index: () => (
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  });
}
