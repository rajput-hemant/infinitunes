import {
  addSongsOptimistic,
  removeSongOptimistic,
  usePlaylists,
  type PlaylistView,
  type UserPlaylist,
} from "@infinitunes/core/react/optimistic-playlists";
import { userMessage } from "@infinitunes/core/user-message";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";

import { useUserId } from "./session";

/**
 * The signed-in listener's playlists with pending writes applied (the shared
 * overlay, so every list and menu changes in the same frame). `undefined`
 * while signed out, loading, or after a failed read: unknown, not empty.
 */
export function useUserPlaylists(): PlaylistView[] | undefined {
  const userId = useUserId();
  const { data } = useQuery({
    ...trpc.user.getUserPlaylists.queryOptions(),
    enabled: userId !== undefined,
  });
  return usePlaylists(data);
}

function refreshPlaylists() {
  return queryClient.invalidateQueries({
    queryKey: trpc.user.getUserPlaylists.queryKey(),
  });
}

type Song = { id: string; name: string };
type Playlist = { id: string; name: string };

/** Adds the song at once; the write follows, and a failure rolls back with a toast. */
export function addSongToPlaylist(playlist: Playlist, song: Song) {
  addSongsOptimistic(playlist.id, [song.id], () =>
    trpcClient.user.addSongsToPlaylist.mutate({
      playlistId: playlist.id,
      songs: [song.id],
    }),
  )
    .then(() => toast.success(`"${song.name}" added to "${playlist.name}"`))
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

/**
 * Hides the song at once. Pass the playlist as the server returned it (not
 * the overlay view): the server gets the song's index in what it holds after
 * any earlier queued removals (see `removeSongOptimistic`). A failure brings
 * the row back with a toast.
 */
export function removeSongFromPlaylist(playlist: UserPlaylist, song: Song) {
  removeSongOptimistic(playlist.id, song.id, playlist.songs, (index) =>
    trpcClient.user.removeSongsFromPlaylist.mutate({
      playlistId: playlist.id,
      index,
      songId: song.id,
    }),
  )
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}
