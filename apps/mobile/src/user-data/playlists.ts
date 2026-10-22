import {
  addSongsOptimistic,
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  moveSongOptimistic,
  removeSongOptimistic,
  renamePlaylistOptimistic,
  usePlaylists,
  usePlaylistDetails,
  usePlaylistDetailList,
  type PlaylistView,
  type UserPlaylist,
} from "@infinitunes/core/react/optimistic-playlists";
import { useQueries, useQuery } from "@tanstack/react-query";

import { reportFailure } from "~/lib/failure";
import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";

import { userQueryKey, useUserId } from "./session";

/**
 * The listener's playlist summaries with the query state.
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

/** Details are private to the account, just like the summary query. */
export function playlistDetailsQuery(id: string, userId: string | undefined) {
  return {
    queryKey: userQueryKey(
      trpc.user.getPlaylistDetails.queryKey({ id }),
      userId,
    ),
    queryFn: () => trpcClient.user.getPlaylistDetails.query({ id }),
  };
}

export function useServerPlaylistDetails(id: string) {
  const userId = useUserId();
  return useQuery({
    ...playlistDetailsQuery(id, userId),
    enabled: userId !== undefined,
  });
}

/** Membership is loaded only for a surface that needs song ids. */
export function usePlaylistMembership(
  playlists: readonly PlaylistView[] | undefined,
  enabled: boolean,
) {
  const userId = useUserId();
  const details = useQueries({
    queries: (enabled ? (playlists ?? []) : [])
      .filter((playlist) => !playlist.pending)
      .map((playlist) => ({
        ...playlistDetailsQuery(playlist.id, userId),
        enabled: enabled && userId !== undefined,
      })),
  });
  return usePlaylistDetailList(details.flatMap(({ data }) => data ?? []));
}

export { usePlaylistDetails };

/** Refetches every account's playlists after a write settles. */
export function refreshPlaylists() {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: trpc.user.getUserPlaylists.queryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.user.getPlaylistDetails.pathKey(),
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

function addSongIds(playlist: UserPlaylist, ids: readonly string[]) {
  addSongsOptimistic(
    playlist.id,
    [...ids],
    () =>
      trpcClient.user.addSongsToPlaylist.mutate({
        playlistId: playlist.id,
        songs: [...ids],
      }),
    playlist.songs,
  )
    .catch(reportFailure(`Couldn't add to ${playlist.name}.`))
    .finally(() => void refreshPlaylists());
}

/** Load membership before adding so duplicate songs do not inflate the count. */
export function addSongsToPlaylist(
  playlist: Playlist,
  songs: readonly Song[],
  userId: string | undefined,
) {
  if (!userId) return;
  void queryClient
    .fetchQuery(playlistDetailsQuery(playlist.id, userId))
    .then((details) => {
      if (!details) throw new Error("Playlist not found");
      addSongIds(
        details,
        songs.map((song) => song.id),
      );
    })
    .catch(reportFailure(`Couldn't add to ${playlist.name}.`));
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
