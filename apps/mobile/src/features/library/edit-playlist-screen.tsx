import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Spinner } from "~/components/ui/spinner";
import { single } from "~/lib/params";
import { renamePlaylist } from "~/user-data/playlists";
import { useServerPlaylists } from "~/user-data/playlists";

import { LibraryListView } from "./library-list-view";
import { PlaylistForm } from "./playlist-form";
import { SignedInGate } from "./signed-in-gate";
import { playlistAsList } from "./use-playlist-by-id";

function EditPlaylist({ id }: { id: string }) {
  const query = useServerPlaylists();
  const found = usePlaylists(query.data)?.find(
    (candidate) => candidate.id === id,
  );
  // The library's summaries are enough to rename: no need for the songs.
  const list = playlistAsList(query, found?.pending ? undefined : found);

  return (
    <LibraryListView
      list={list}
      // A form, not a list: a spinner as `SignedInGate`'s, not song rows.
      skeleton={
        <View className="flex-1 items-center justify-center">
          <Spinner accessibilityLabel="Loading" />
        </View>
      }
      empty={{
        icon: { ios: "music.note.list", android: "queue_music" },
        title: "Playlist not found",
        message: "It may have been deleted.",
        action: { label: "Close", onPress: () => router.back() },
      }}
    >
      {({ items: [playlist] }) => (
        <PlaylistForm
          initial={playlist}
          submitLabel="Save"
          onSubmit={(details) => {
            renamePlaylist(id, details);
            router.back();
          }}
        />
      )}
    </LibraryListView>
  );
}

export function EditPlaylistScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = single(params.id) ?? "";

  return (
    <>
      <Stack.Screen options={{ title: "Rename Playlist" }} />
      <SignedInGate>
        <EditPlaylist id={id} />
      </SignedInGate>
    </>
  );
}
