import "../global.css";
import { Stack } from "expo-router";
import { Platform } from "react-native";

import { FailureSnackbar } from "~/components/failure-snackbar";
import { PlaybackController } from "~/playback/playback-controller";
import { AppProviders } from "~/providers/app-providers";
import { useRadii } from "~/theme/use-radii";
import { AssistantPlaylists } from "~/user-data/assistant-playlists";

/** A deep link straight to a modal (`/player`, `/login`) still opens it over the tabs. */
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  // Material 3's bottom sheet has extra-large (28dp) top corners; Android's
  // form sheet is square without one. iOS keeps the system's sheet corners.
  const corner = useRadii();
  const sheetCornerRadius = Platform.select({ android: corner.xl });
  return (
    <AppProviders>
      <PlaybackController />
      <AssistantPlaylists />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        {/* One Now Playing: a second push or replace while it is open reuses
            it. A whole page, not a card over the tabs (Apple Music): over full
            screen keeps the tabs drawn underneath, so the player's own drag
            down (`useDismissPan`) shows them as it follows the finger. Not
            the native stack's vertical swipe: it starts on sideways drags
            too, which belong to the song swipe and the scrubber. A drag that
            closes it takes the page off screen itself and pops with no
            animation; Back and the grabber keep this slide. */}
        <Stack.Screen
          name="player"
          dangerouslySingular
          options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="languages"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            sheetCornerRadius,
            headerShown: true,
            title: "Languages",
          }}
        />
        {/* A double tap on Create reuses the open sheet instead of stacking a second. */}
        <Stack.Screen
          name="create-playlist"
          dangerouslySingular
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            sheetCornerRadius,
            headerShown: true,
            title: "New Playlist",
          }}
        />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
        {/* Siri / Assistant links: a spinner that runs the action and leaves. */}
        <Stack.Screen name="action/[action]" options={{ animation: "none" }} />
      </Stack>
      <FailureSnackbar />
    </AppProviders>
  );
}
