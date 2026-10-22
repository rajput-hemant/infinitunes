import { orderByIds } from "@infinitunes/core/liked-songs";
import type { SongRowItem } from "@infinitunes/types";
import { useMemo } from "react";

import { fetchSongRows } from "~/lib/song-rows";
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
  const held = useMemo(() => [...playlist.songs].sort(), [playlist.songs]);
  const list = useResolvedItems({
    scope: `playlist-${playlist.id}`,
    source: { ids: held, reload: refreshPlaylists },
    resolve: fetchSongRows,
  });

  if (list.status !== "ready") return list;
  return {
    ...list,
    items: orderByIds(playlist.songs, list.items),
  };
}
