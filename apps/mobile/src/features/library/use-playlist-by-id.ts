import {
  usePlaylistDetails,
  type UserPlaylist,
} from "@infinitunes/core/react/optimistic-playlists";
import type { UseQueryResult } from "@tanstack/react-query";

import { useServerPlaylistDetails } from "~/user-data/playlists";

import type { LibraryList } from "./library-list";

type PlaylistQuery = Pick<
  UseQueryResult<unknown>,
  "isPending" | "data" | "error" | "refetch"
>;

/**
 * One playlist read as a list of at most one item, so its screens share
 * `LibraryListView`'s states: loading, a failed read (no data) with a retry,
 * and not found as the empty list (`item` missing: no such playlist, or one
 * deleted or still being created).
 */
export function playlistAsList<Item>(
  query: PlaylistQuery,
  item: Item | null | undefined,
): LibraryList<Item> {
  if (query.isPending) return { status: "loading" };
  if (query.data === undefined) {
    return {
      status: "error",
      error: query.error,
      retry: () => void query.refetch(),
    };
  }
  return {
    status: "ready",
    items: item ? [item] : [],
    missing: 0,
    refresh: () => query.refetch(),
  };
}

export type PlaylistById = {
  /** With pending edits applied: what the screen shows. */
  playlist: UserPlaylist;
  /** As the server holds it: removals and moves index into this copy. */
  server: UserPlaylist;
};

/** One of the listener's playlists with its songs, by id. */
export function usePlaylistById(id: string): LibraryList<PlaylistById> {
  const query = useServerPlaylistDetails(id);
  const playlist = usePlaylistDetails(query.data);
  const server = query.data;
  return playlistAsList(
    query,
    server && playlist ? { playlist, server } : undefined,
  );
}
