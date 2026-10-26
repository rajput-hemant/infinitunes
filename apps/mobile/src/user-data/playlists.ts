import {
  addSongsOptimistic,
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  moveSongOptimistic,
  removeSongOptimistic,
  renamePlaylistOptimistic,
  usePlaylists,
  usePlaylistSongSets,
  type PlaylistView,
  type UserPlaylist,
} from "@infinitunes/core/react/optimistic-playlists";
import { useQuery } from "@tanstack/react-query";

import { reportFailure } from "~/lib/failure";
import { confirm } from "~/lib/haptics";
import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";

import { userQueryKey, useUserId } from "./session";

/**
 * The listener's playlist summaries (count and cover ids, no songs) with the
 * query's state; the songs come from `useServerPlaylistDetails`.
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

/** One playlist's detail query (its songs) for `userId`. */
export function playlistDetailsQuery(
  playlistId: string,
  userId: string | undefined,
) {
  return {
    queryKey: userQueryKey(
      trpc.user.getPlaylistDetails.queryKey({ playlistId }),
      userId,
    ),
    queryFn: () => trpcClient.user.getPlaylistDetails.query({ playlistId }),
  };
}

/**
 * One playlist exactly as the server holds it (`null` when it has none by
 * that id). Removing or moving a song needs this raw copy (the server indexes
 * what it holds); the screen shows it through `usePlaylistDetails`.
 */
export function useServerPlaylistDetails(playlistId: string) {
  const userId = useUserId();
  return useQuery({
    ...playlistDetailsQuery(playlistId, userId),
    enabled: userId !== undefined,
  });
}

/** Every playlist's song ids of `userId`, in one request (`getPlaylistMembership`). */
export function playlistMembershipQuery(userId: string | undefined) {
  return {
    queryKey: userQueryKey(trpc.user.getPlaylistMembership.queryKey(), userId),
    queryFn: () => trpcClient.user.getPlaylistMembership.query(),
  };
}

/**
 * The songs each playlist holds, with pending writes applied, for the "Add to
 * Playlist" check marks: one query every menu shares, and one map per answer.
 * Empty until it loads (no marks, as for a playlist without the songs).
 * M3 builds menus on first press; load this there, lazily.
 */
export function usePlaylistMembership(): ReadonlyMap<
  string,
  ReadonlySet<string>
> {
  const userId = useUserId();
  const { data } = useQuery({
    ...playlistMembershipQuery(userId),
    enabled: userId !== undefined,
  });
  return usePlaylistSongSets(data) ?? NO_MEMBERSHIP;
}

const NO_MEMBERSHIP: ReadonlyMap<string, ReadonlySet<string>> = new Map();

/** Refetches every account's playlists after a write settles. */
export function refreshPlaylists() {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: trpc.user.getUserPlaylists.queryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.user.getPlaylistDetails.pathKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.user.getPlaylistMembership.queryKey(),
    }),
  ]);
}

/*
 * Each write below shows in every list at once (the shared overlay) and rolls
 * back when it fails, saying why in the failure snackbar (the server's
 * refusal, such as the playlist cap, or generic copy). Nothing here clears the overlay: it drops
 * its own records once the refreshed playlists agree.
 */

export type PlaylistDetails = { name: string; description?: string };

export function createPlaylist(details: PlaylistDetails) {
  createPlaylistOptimistic(details, () =>
    trpcClient.user.createNewPlaylist.mutate(details),
  )
    .then(confirm)
    .catch(reportFailure("Couldn't create the playlist."))
    .finally(() => void refreshPlaylists());
}

export function renamePlaylist(id: string, details: PlaylistDetails) {
  renamePlaylistOptimistic(id, details, () =>
    trpcClient.user.renamePlaylist.mutate({ playlistId: id, ...details }),
  )
    .catch(reportFailure("Couldn't rename the playlist."))
    .finally(() => void refreshPlaylists());
}

export function deletePlaylist(id: string) {
  deletePlaylistOptimistic(id, () =>
    trpcClient.user.deletePlaylist.mutate({ playlistId: id }),
  )
    .catch(reportFailure("Couldn't delete the playlist."))
    .finally(() => void refreshPlaylists());
}

type Song = { id: string; name: string };
type Playlist = { id: string; name: string };

function addSongIds(playlist: Playlist, ids: readonly string[]) {
  addSongsOptimistic(playlist.id, [...ids], () =>
    trpcClient.user.addSongsToPlaylist.mutate({
      playlistId: playlist.id,
      songs: [...ids],
    }),
  )
    .then(confirm)
    .catch(reportFailure(`Couldn't add to ${playlist.name}.`))
    .finally(() => void refreshPlaylists());
}

/** Adds the songs at once; the write follows, and a failure rolls back. */
export function addSongsToPlaylist(playlist: Playlist, songs: readonly Song[]) {
  addSongIds(
    playlist,
    songs.map((song) => song.id),
  );
}

/**
 * Creates a playlist and then adds the songs to it. The playlist shows as
 * pending at once; the songs follow only once the server has minted its id,
 * so a refused create (the playlist cap) adds nothing.
 */
export function createPlaylistWithSongs(
  details: PlaylistDetails,
  songIds: readonly string[],
) {
  createPlaylistOptimistic(details, () =>
    trpcClient.user.createNewPlaylist.mutate(details),
  )
    .then((playlist) => {
      if (songIds.length > 0) addSongIds(playlist, songIds);
    })
    .catch(reportFailure("Couldn't create the playlist."))
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
 * failure puts the song back. Pass the server's copy as
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
    .catch(reportFailure("Couldn't move the song."))
    .finally(() => void refreshPlaylists());
}

/**
 * Hides the song at once. Pass the playlist as the server returned it (not
 * the overlay view): the server gets the song's index in what it holds after
 * any earlier queued removals (see `removeSongOptimistic`). A failure brings
 * the row back.
 */
export function removeSongFromPlaylist(playlist: UserPlaylist, song: Song) {
  removeSongOptimistic(playlist.id, song.id, playlist.songs, (index) =>
    trpcClient.user.removeSongsFromPlaylist.mutate({
      playlistId: playlist.id,
      index,
      songId: song.id,
    }),
  )
    .catch(reportFailure(`Couldn't remove ${song.name}.`))
    .finally(() => void refreshPlaylists());
}
