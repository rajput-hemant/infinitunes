import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { Spinner } from "~/components/ui/spinner";
import { renamePlaylist } from "~/user-data/playlists";
import { useServerPlaylists } from "~/user-data/playlists";

import { PlaylistForm } from "./playlist-form";
import { SignedInGate } from "./signed-in-gate";

function EditPlaylist({ id }: { id: string }) {
  const { data, error, isPending, refetch } = useServerPlaylists();
  const playlists = usePlaylists(data);
  const playlist = playlists?.find((candidate) => candidate.id === id);

  // A form, not a list: a spinner as `SignedInGate`'s, not song rows.
  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner accessibilityLabel="Loading" />
      </View>
    );
  }
  if (!playlists) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }
  if (!playlist || playlist.pending) {
    return (
      <EmptyState
        icon={{ ios: "music.note.list", android: "queue_music" }}
        title="Playlist not found"
        message="It may have been deleted."
        action={{ label: "Close", onPress: () => router.back() }}
      />
    );
  }

  return (
    <PlaylistForm
      initial={playlist}
      submitLabel="Save"
      onSubmit={(details) => {
        renamePlaylist(id, details);
        router.back();
      }}
    />
  );
}

export function EditPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Rename Playlist" }} />
      <SignedInGate>
        <EditPlaylist id={id} />
      </SignedInGate>
    </>
  );
}
