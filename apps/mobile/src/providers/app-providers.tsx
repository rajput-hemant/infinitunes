import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { queryClient } from "~/lib/query-client";
import { useNavigationTheme } from "~/theme/navigation-theme";

/**
 * App-wide providers. Expo Router already supplies the safe-area provider,
 * and the auth session needs none: `authClient.useSession()` reads a shared
 * store.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const navigationTheme = useNavigationTheme();

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            {children}
            <StatusBar style="auto" />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
