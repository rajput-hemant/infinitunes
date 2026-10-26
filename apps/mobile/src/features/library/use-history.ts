import {
  lookupSongsChunked,
  resolveWithCache,
} from "@infinitunes/core/liked-songs";
import type { SongRowItem } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

import { toRowLookup } from "~/lib/song-rows";
import { trpcClient } from "~/lib/trpc";
import {
  LIBRARY_QUERY_KEY,
  userQueryKey,
  useUserId,
} from "~/user-data/session";

import { useResolvedItems, type IdSource } from "./use-resolved-items";

/**
 * The played ids, newest first. Tab stacks keep a screen mounted, so a play
 * made elsewhere only shows up when the screen is focused again.
 */
function useHistoryIds(): IdSource {
  const userId = useUserId();
  const query = useQuery({
    queryKey: userQueryKey([...LIBRARY_QUERY_KEY, "history-ids"], userId),
    queryFn: () => trpcClient.history.list.query(),
    enabled: userId !== undefined,
    staleTime: 0,
  });

  const { refetch } = query;
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // The first focus is the mount, which already fetched.
      if (focused.current) void refetch();
      focused.current = true;
    }, [refetch]),
  );

  return {
    ids: query.data?.map(({ id }) => id),
    error: query.data ? undefined : query.error,
    reload: refetch,
  };
}

/** Recently played songs and episodes, newest first. */
export function useHistory() {
  return useResolvedItems<SongRowItem>({
    scope: "history",
    // `song.items` also resolves episodes: its own cache, not `song-row`'s.
    itemKind: "history-row",
    source: useHistoryIds(),
    resolve: (ids, cache) =>
      resolveWithCache(ids, cache, async (misses) =>
        toRowLookup(
          await lookupSongsChunked(misses, (input) =>
            trpcClient.song.items.query(input),
          ),
        ),
      ),
  });
}
