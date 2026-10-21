import { fetchSongsChunked, orderByIds } from "@infinitunes/core/liked-songs";
import { toSongRow } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

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
  return useResolvedItems({
    scope: "history",
    source: useHistoryIds(),
    resolve: async (ids) => {
      const items = await fetchSongsChunked(ids, (input) =>
        trpcClient.song.items.query(input),
      );
      return items && orderByIds(ids, items).map(toSongRow);
    },
  });
}
