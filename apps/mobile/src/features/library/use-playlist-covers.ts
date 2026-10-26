import type { SongRowItem } from "@infinitunes/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryItemCache } from "~/lib/item-cache";
import { fetchSongRows } from "~/lib/song-rows";
import {
  LIBRARY_QUERY_KEY,
  userQueryKey,
  useUserId,
} from "~/user-data/session";

/**
 * Each playlist's cover: its first song's artwork, looked up in one batch
 * through the song rows cache, so only a new first song is fetched. Empty
 * while loading, on failure, and for an empty playlist (the row keeps its
 * icon then).
 */
export function usePlaylistCovers(
  playlists: readonly { songs: readonly string[] }[] | undefined,
): ReadonlyMap<string, string> {
  const userId = useUserId();
  const client = useQueryClient();
  const firstIds = [
    ...new Set(playlists?.flatMap(({ songs }) => songs[0] ?? []) ?? []),
  ].sort();
  const { data } = useQuery({
    queryKey: [
      ...userQueryKey([...LIBRARY_QUERY_KEY, "playlist-covers"], userId),
      firstIds,
    ],
    queryFn: async () => {
      const rows = await fetchSongRows(
        firstIds,
        queryItemCache<SongRowItem>(client, "song-row"),
      );
      return new Map(rows?.map(({ id, image }) => [id, image]));
    },
    enabled: userId !== undefined && firstIds.length > 0,
    // A new playlist or a changed first song keeps the other covers up.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey.at(-2) === userId ? previous : undefined,
  });
  return data ?? EMPTY;
}

const EMPTY: ReadonlyMap<string, string> = new Map();
