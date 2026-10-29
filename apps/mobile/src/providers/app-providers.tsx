import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { queryClient } from "~/lib/query-client";
import { restoreAppearance } from "~/theme/appearance";
import { DynamicColorRoot } from "~/theme/dynamic-color-root";
import { useNavigationTheme } from "~/theme/navigation-theme";
import { ThemeRoot } from "~/theme/theme-root";
import { useOptimisticOwner } from "~/user-data/session";

// The OS keeps no colour-scheme override between launches: apply the saved
// one before the first frame.
restoreAppearance();

/**
 * App-wide providers. Expo Router already supplies the safe-area provider,
 * and the auth session needs none: `authClient.useSession()` reads a shared
 * store. Sheets are native (`formSheet` routes, `@expo/ui`'s `BottomSheet`),
 * so no JS sheet provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const navigationTheme = useNavigationTheme();
  useOptimisticOwner();

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Material You content colours on Android 12+, under every screen. */}
      <DynamicColorRoot>
        {/* The query client is outside ThemeRoot: the playing accent reads the cover's colours. */}
        <QueryClientProvider client={queryClient}>
          <ThemeRoot>
            <ThemeProvider value={navigationTheme}>
              {children}
              <StatusBar style="auto" />
            </ThemeProvider>
          </ThemeRoot>
        </QueryClientProvider>
      </DynamicColorRoot>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
