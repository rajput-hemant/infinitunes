import { fetchSongsChunked } from "@infinitunes/core/liked-songs";
import { toSongRow } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";
import { useMemo } from "react";

import { trpcClient } from "~/lib/trpc";
import { refreshPlaylists } from "~/user-data/playlists";

import type { LibraryList } from "./library-list";
import { useResolvedItems } from "./use-resolved-items";

/**
 * The songs of one playlist in its own order. `playlist.songs` is the
 * overlay's list: the lookup is keyed by which songs it holds, not their
 * order, so a pending move or removal shows at once while the songs already
 * loaded are put in the new order.
 */
export function usePlaylistSongs(playlist: {
  id: string;
  songs: readonly string[];
}): LibraryList<SongRowItem> {
  const held = useMemo(() => playlist.songs.toSorted(), [playlist.songs]);
  const list = useResolvedItems({
    scope: `playlist-${playlist.id}`,
    source: { ids: held, reload: refreshPlaylists },
    resolve: async (ids) => {
      const songs = await fetchSongsChunked(ids, (input) =>
        trpcClient.song.details.query(input),
      );
      return songs?.map(toSongRow);
    },
  });

  if (list.status !== "ready") return list;
  const byId = new Map(list.items.map((song) => [song.id, song]));
  return {
    ...list,
    items: playlist.songs.flatMap((id) => byId.get(id) ?? []),
  };
}
