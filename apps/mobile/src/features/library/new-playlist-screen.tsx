import { router, Stack, useLocalSearchParams } from "expo-router";

import { createPlaylist, createPlaylistWithSongs } from "~/user-data/playlists";

import { PlaylistForm } from "./playlist-form";
import { SignedInGate } from "./signed-in-gate";

/** Comma-joined song ids from a menu's "New Playlist"; none from the library. */
function songIdsOf(param: string | undefined): string[] {
  return param ? param.split(",").filter(Boolean) : [];
}

/**
 * Names a new playlist. Opened from a song menu's "Add to Playlist", it
 * also adds those songs (the `songs` param) once created.
 */
export function NewPlaylistScreen() {
  const { songs } = useLocalSearchParams<{ songs?: string }>();
  const songIds = songIdsOf(songs);

  return (
    <>
      <Stack.Screen options={{ title: "New Playlist" }} />
      <SignedInGate placement="top">
        <PlaylistForm
          submitLabel="Create"
          onSubmit={(details) => {
            // The pending row shows in the library while the server mints its id.
            if (songIds.length > 0) {
              createPlaylistWithSongs(details, songIds);
            } else {
              createPlaylist(details);
            }
            router.back();
          }}
        />
      </SignedInGate>
    </>
  );
}
