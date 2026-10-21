import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";

import { AnnouncingToast } from "~/components/ui/toast-wrapper";
import { queryClient } from "~/lib/query-client";
import { installDynamicColors } from "~/theme/android-colors";
import { restoreAppearance } from "~/theme/appearance";
import { useNavigationTheme } from "~/theme/navigation-theme";
import { useOptimisticOwner } from "~/user-data/session";

// The OS keeps no colour-scheme override between launches: apply the saved
// one before the first frame, then point the colour classes at Material You
// (Android 12+; `global.css`, imported first by the root layout, registered
// the palette they replace).
restoreAppearance();
installDynamicColors();

/**
 * App-wide providers. Expo Router already supplies the safe-area provider,
 * and the auth session needs none: `authClient.useSession()` reads a shared
 * store. `Toaster` renders every `toast()` from `sonner-native` in a window
 * overlay, so toasts show above modals and sheets too (VoiceOver hears
 * them through `AnnouncingToast`). Sheets are native
 * (`formSheet` routes, `@expo/ui`'s `BottomSheet`), so no JS sheet provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const navigationTheme = useNavigationTheme();
  useOptimisticOwner();

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          {children}
          <Toaster ToastWrapper={AnnouncingToast} />
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
