import { router, Stack } from "expo-router";

import { createPlaylist } from "./playlist-actions";
import { PlaylistForm } from "./playlist-form";
import { SignedInGate } from "./signed-in-gate";

export function NewPlaylistScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "New Playlist" }} />
      <SignedInGate>
        <PlaylistForm
          submitLabel="Create"
          onSubmit={(details) => {
            // The pending row shows in the library while the server mints its id.
            createPlaylist(details);
            router.back();
          }}
        />
      </SignedInGate>
    </>
  );
}
