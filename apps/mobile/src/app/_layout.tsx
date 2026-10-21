import "../global.css";
import { Stack } from "expo-router";

import { PlaybackController } from "~/playback/playback-controller";
import { AppProviders } from "~/providers/app-providers";
import { AssistantPlaylists } from "~/user-data/assistant-playlists";

/** A deep link straight to a modal (`/player`, `/login`) still opens it over the tabs. */
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  return (
    <AppProviders>
      <PlaybackController />
      <AssistantPlaylists />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        {/* One Now Playing: a second push or replace while it is open reuses it. */}
        <Stack.Screen
          name="player"
          dangerouslySingular
          options={{ presentation: "modal" }}
        />
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
        <Stack.Screen
          name="languages"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            headerShown: true,
            title: "Languages",
          }}
        />
        <Stack.Screen
          name="create-playlist"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            headerShown: true,
            title: "New Playlist",
          }}
        />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
        {/* Siri / Assistant links: a spinner that runs the action and leaves. */}
        <Stack.Screen name="action/[action]" options={{ animation: "none" }} />
      </Stack>
    </AppProviders>
  );
}
