import {
  addSongsOptimistic,
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  moveSongOptimistic,
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
    ...serverPlaylistsQuery(userId),
    enabled: userId !== undefined,
  });
}

/** The playlists query of `userId`, for hooks and `queryClient.fetchQuery`. */
export function serverPlaylistsQuery(userId: string | undefined) {
  return {
    queryKey: userQueryKey(trpc.user.getUserPlaylists.queryKey(), userId),
    queryFn: () => trpcClient.user.getUserPlaylists.query(),
  };
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

/** How a toast names the songs: `"FA9LA"` for one, "12 songs" for more. */
export function songsLabel(songs: readonly Song[]): string {
  const [only] = songs;
  return songs.length === 1 && only
    ? `"${only.name}"`
    : `${songs.length} songs`;
}

function addSongIds(playlist: Playlist, ids: readonly string[], what: string) {
  addSongsOptimistic(playlist.id, [...ids], () =>
    trpcClient.user.addSongsToPlaylist.mutate({
      playlistId: playlist.id,
      songs: [...ids],
    }),
  )
    .then(() => toast.success(`${what} added to "${playlist.name}"`))
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

/** Adds the songs at once; the write follows, and a failure rolls back with a toast. */
export function addSongsToPlaylist(playlist: Playlist, songs: readonly Song[]) {
  addSongIds(
    playlist,
    songs.map((song) => song.id),
    songsLabel(songs),
  );
}

/**
 * Creates a playlist and then adds the songs (named `what` in the toast) to
 * it. The playlist shows as pending at once; the songs follow only once the
 * server has minted its id, so a refused create (the playlist cap) adds
 * nothing.
 */
export function createPlaylistWithSongs(
  details: PlaylistDetails,
  songIds: readonly string[],
  what: string,
) {
  createPlaylistOptimistic(details, () =>
    trpcClient.user.createNewPlaylist.mutate(details),
  )
    .then((playlist) => {
      toast.success(`Playlist "${playlist.name}" created`);
      if (songIds.length > 0) addSongIds(playlist, songIds, what);
    })
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

/** `ids` with `songId` moved in front of `before` (to the end without one). */
function placeSong(
  ids: readonly string[],
  songId: string,
  before: string | undefined,
) {
  const rest = ids.filter((id) => id !== songId);
  const at = before === undefined ? -1 : rest.indexOf(before);
  rest.splice(at === -1 ? rest.length : at, 0, songId);
  return rest;
}

/**
 * Moves the song in front of `before` at once (the playlist as shown, with
 * pending writes); the server gets the positions in what it holds, and a
 * failure puts the song back with a toast. Pass the server's copy as
 * `playlist`, as for removals.
 */
export function moveSongInPlaylist(
  playlist: UserPlaylist,
  shown: readonly string[],
  song: Song,
  before: string | undefined,
) {
  moveSongOptimistic(
    playlist.id,
    song.id,
    placeSong(shown, song.id, before),
    playlist.songs,
    (from, to) =>
      trpcClient.user.movePlaylistSong.mutate({
        playlistId: playlist.id,
        from,
        to,
        songId: song.id,
      }),
  )
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
