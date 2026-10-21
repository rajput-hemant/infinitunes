import "../global.css";
import { Stack } from "expo-router";

import { PlaybackController } from "~/playback/playback-controller";
import { AppProviders } from "~/providers/app-providers";

/** A deep link straight to a modal (`/player`, `/login`) still opens it over the tabs. */
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  return (
    <AppProviders>
      <PlaybackController />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="queue"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            headerShown: true,
            title: "Up Next",
          }}
        />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      </Stack>
    </AppProviders>
  );
}
