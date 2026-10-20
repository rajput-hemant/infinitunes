import "../global.css";
import { Stack } from "expo-router";

import { AppProviders } from "~/providers/app-providers";

/** A deep link straight to a modal (`/player`, `/login`) still opens it over the tabs. */
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player" options={{ presentation: "modal" }} />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      </Stack>
    </AppProviders>
  );
}
