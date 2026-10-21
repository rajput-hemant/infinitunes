import { useQuery } from "@tanstack/react-query";

import { queryClient } from "~/lib/query-client";
import { trpc, trpcClient } from "~/lib/trpc";
import { userQueryKey, useUserId } from "~/user-data/session";

/**
 * The listener's playlists exactly as the server holds them, with the query's
 * state. Same cache entry as `useUserPlaylists`, which layers pending writes
 * over it; removing a song needs this raw copy (see `removeSongFromPlaylist`).
 */
export function useServerPlaylists() {
  const userId = useUserId();
  return useQuery({
    queryKey: userQueryKey(trpc.user.getUserPlaylists.queryKey(), userId),
    queryFn: () => trpcClient.user.getUserPlaylists.query(),
    enabled: userId !== undefined,
  });
}

export function refreshPlaylists() {
  return queryClient.invalidateQueries({
    queryKey: trpc.user.getUserPlaylists.queryKey(),
  });
}
