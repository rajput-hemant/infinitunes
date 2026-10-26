import type { ItemCache } from "@infinitunes/core/liked-songs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryItemCache } from "~/lib/item-cache";
import {
  LIBRARY_QUERY_KEY,
  userQueryKey,
  useUserId,
} from "~/user-data/session";

import type { LibraryList } from "./library-list";

/** Where the saved ids come from: the favorites row, history, a playlist. */
export type IdSource = {
  /** `undefined` while they load. */
  ids: readonly string[] | undefined;
  error?: unknown;
  reload: () => Promise<unknown>;
};

type ResolveOptions<Item> = {
  /** Cache namespace of this list. */
  scope: string;
  /**
   * The per-id cache its lookups use (`song-row`): lists of the same kind of
   * item reuse each other's lookups.
   */
  itemKind: string;
  source: IdSource;
  /**
   * Looks the ids up upstream through `cache`, so only ids it does not hold
   * are fetched; `undefined` when none could be fetched.
   */
  resolve: (
    ids: string[],
    // The items' type comes from what `resolve` returns.
    cache: ItemCache<NoInfer<Item>>,
  ) => Promise<Item[] | undefined>;
};

export const UNAVAILABLE = new Error(
  "The music service isn't answering right now. Try again in a moment.",
);

/**
 * Turns saved ids into the items they name. A new id list (an unlike, a new
 * play) is a new query, and the previous items stay up until it lands, so the
 * list never flashes a skeleton for a one-row change. Each id's item is cached
 * on its own, so that query only asks upstream for ids it has not seen; pull
 * to refresh asks for all of them again.
 */
export function useResolvedItems<Item>({
  scope,
  itemKind,
  source,
  resolve,
}: ResolveOptions<Item>): LibraryList<Item> {
  const userId = useUserId();
  const client = useQueryClient();
  const cache = useMemo(
    () => queryItemCache<Item>(client, itemKind),
    [client, itemKind],
  );
  const { ids } = source;

  const query = useQuery({
    queryKey: [...userQueryKey([...LIBRARY_QUERY_KEY, scope], userId), ids],
    queryFn: async () => {
      const wanted = [...(ids ?? [])];
      if (wanted.length === 0) return { items: [], missing: 0 };
      const items = await resolve(wanted, cache);
      if (!items) throw UNAVAILABLE;
      return { items, missing: wanted.length - items.length };
    },
    enabled: userId !== undefined && ids !== undefined,
    // The key ends `[..., userId, ids]`: keep the last items across a changed
    // id list, never across a changed account (they are another listener's).
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey.at(-2) === userId ? previous : undefined,
  });

  if (source.error) {
    return {
      status: "error",
      error: source.error,
      retry: () => void source.reload(),
    };
  }
  if (!query.data) {
    return query.isError
      ? {
          status: "error",
          error: query.error,
          retry: () => void query.refetch(),
        }
      : { status: "loading" };
  }
  return {
    status: "ready",
    items: query.data.items,
    missing: query.data.missing,
    refresh: () => {
      cache.forget();
      return Promise.all([source.reload(), query.refetch()]);
    },
  };
}
