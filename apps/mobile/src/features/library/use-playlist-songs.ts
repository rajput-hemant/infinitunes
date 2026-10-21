import { fetchSongsChunked, orderByIds } from "@infinitunes/core/liked-songs";
import { toSongRow } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";

import { trpcClient } from "~/lib/trpc";
import { refreshPlaylists } from "~/user-data/playlists";

import type { LibraryList } from "./library-list";
import { useResolvedItems } from "./use-resolved-items";

/**
 * The songs of one playlist in its own order. `playlist.songs` is the
 * overlay's list, so a pending removal hides its row at once even while the
 * lookup for the new list is still running.
 */
export function usePlaylistSongs(playlist: {
  id: string;
  songs: readonly string[];
}): LibraryList<SongRowItem> {
  const list = useResolvedItems({
    scope: `playlist-${playlist.id}`,
    source: { ids: playlist.songs, reload: refreshPlaylists },
    resolve: async (ids) => {
      const songs = await fetchSongsChunked(ids, (input) =>
        trpcClient.song.details.query(input),
      );
      return songs && orderByIds(ids, songs).map(toSongRow);
    },
  });

  if (list.status !== "ready") return list;
  const present = new Set(playlist.songs);
  return {
    ...list,
    items: list.items.filter((song) => present.has(song.id)),
  };
}
