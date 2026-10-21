import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { SongListSkeleton } from "~/components/skeletons";

import { renamePlaylist } from "./playlist-actions";
import { PlaylistForm } from "./playlist-form";
import { SignedInGate } from "./signed-in-gate";
import { useServerPlaylists } from "./use-server-playlists";

function EditPlaylist({ id }: { id: string }) {
  const { data, error, isPending, refetch } = useServerPlaylists();
  const playlists = usePlaylists(data);
  const playlist = playlists?.find((candidate) => candidate.id === id);

  if (isPending) return <SongListSkeleton rows={2} />;
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
