import {
  addSongsOptimistic,
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  removeSongOptimistic,
  renamePlaylistOptimistic,
  usePlaylists,
  type PlaylistView,
  type UserPlaylist,
} from "@infinitunes/core/react/optimistic-playlists";
import { userMessage } from "@infinitunes/core/user-message";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";

import { userQueryKey, useUserId } from "./session";

/**
 * The listener's playlists exactly as the server holds them, with the
 * query's state. Removing or moving a song needs this raw copy (the server
 * indexes what it holds); lists and menus show `useUserPlaylists`.
 */
export function useServerPlaylists() {
  const userId = useUserId();
  return useQuery({
    queryKey: userQueryKey(trpc.user.getUserPlaylists.queryKey(), userId),
    queryFn: () => trpcClient.user.getUserPlaylists.query(),
    enabled: userId !== undefined,
  });
}

/**
 * The signed-in listener's playlists with pending writes applied (the shared
 * overlay, so every list and menu changes in the same frame). `undefined`
 * while signed out, loading, or after a failed read: unknown, not empty.
 */
export function useUserPlaylists(): PlaylistView[] | undefined {
  return usePlaylists(useServerPlaylists().data);
}

/** Refetches every account's playlists after a write settles. */
export function refreshPlaylists() {
  return queryClient.invalidateQueries({
    queryKey: trpc.user.getUserPlaylists.queryKey(),
  });
}

/*
 * Each write below shows in every list at once (the shared overlay) and rolls
 * back with a toast when it fails. Nothing here clears the overlay: it drops
 * its own records once the refreshed playlists agree.
 */

export type PlaylistDetails = { name: string; description?: string };

export function createPlaylist(details: PlaylistDetails) {
  createPlaylistOptimistic(details, () =>
    trpcClient.user.createNewPlaylist.mutate(details),
  )
    .then((playlist) => toast.success(`Playlist "${playlist.name}" created`))
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

export function renamePlaylist(id: string, details: PlaylistDetails) {
  renamePlaylistOptimistic(id, details, () =>
    trpcClient.user.renamePlaylist.mutate({ playlistId: id, ...details }),
  )
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

export function deletePlaylist(id: string, name: string) {
  deletePlaylistOptimistic(id, () =>
    trpcClient.user.deletePlaylist.mutate({ playlistId: id }),
  )
    .then(() => toast.success(`Playlist "${name}" deleted`))
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

type Song = { id: string; name: string };
type Playlist = { id: string; name: string };

function addedMessage(songs: readonly Song[], playlist: Playlist) {
  const [only] = songs;
  const what =
    songs.length === 1 && only ? `"${only.name}"` : `${songs.length} songs`;
  return `${what} added to "${playlist.name}"`;
}

/** Adds the songs at once; the write follows, and a failure rolls back with a toast. */
export function addSongsToPlaylist(playlist: Playlist, songs: readonly Song[]) {
  const ids = songs.map((song) => song.id);
  addSongsOptimistic(playlist.id, ids, () =>
    trpcClient.user.addSongsToPlaylist.mutate({
      playlistId: playlist.id,
      songs: ids,
    }),
  )
    .then(() => toast.success(addedMessage(songs, playlist)))
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
