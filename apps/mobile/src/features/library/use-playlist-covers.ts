import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
import { useQuery } from "@tanstack/react-query";

import { fetchSongRows } from "~/lib/song-rows";
import { usePlaylistMembership } from "~/user-data/playlists";
import {
  LIBRARY_QUERY_KEY,
  userQueryKey,
  useUserId,
} from "~/user-data/session";

/**
 * Each playlist's cover: its first song's artwork, looked up in one batch.
 * Empty while loading, on failure, and for an empty playlist (the row keeps
 * its icon then).
 */
export function usePlaylistCovers(
  playlists: readonly PlaylistView[] | undefined,
): ReadonlyMap<string, string> {
  const userId = useUserId();
  const details = usePlaylistMembership(playlists, true);
  const firstIds = [
    ...new Set(details?.flatMap(({ songs }) => songs[0] ?? []) ?? []),
  ].sort();
  const { data } = useQuery({
    queryKey: [
      ...userQueryKey([...LIBRARY_QUERY_KEY, "playlist-covers"], userId),
      firstIds,
    ],
    queryFn: async () => {
      const rows = await fetchSongRows(firstIds);
      return new Map(rows?.map(({ id, image }) => [id, image]));
    },
    enabled: userId !== undefined && firstIds.length > 0,
    // A new playlist or a changed first song keeps the other covers up.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey.at(-2) === userId ? previous : undefined,
  });
  return new Map(
    details?.flatMap((playlist) => {
      const first = playlist.songs[0];
      const image = first && data?.get(first);
      return image ? [[playlist.id, image]] : [];
    }),
  );
}
