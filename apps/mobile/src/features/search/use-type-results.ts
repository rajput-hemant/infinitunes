import { getErrorCode } from "@infinitunes/core/error-code";

import { trpc, trpcClient } from "~/lib/trpc";
import { useInfiniteList } from "~/lib/use-infinite-list";

import type { SearchEntry } from "./result-cards";
import { BY_TYPE_INPUT } from "./search-types";
import type { ListSearchType } from "./search-types";

const PAGE_SIZE = 50;

export type TypeResultsStatus = "loading" | "error" | "empty" | "ready";

/**
 * Every page of `search.byType` results for one type, fetched as the list
 * scrolls. Empty lists of albums, playlists, artists and podcasts come back
 * as NOT_FOUND, which is an empty result, not a failure.
 */
export function useTypeResults(query: string, type: ListSearchType) {
  const list = useInfiniteList({
    queryKey: [...trpc.search.byType.pathKey(), { q: query, type }],
    fetchPage: (page) =>
      trpcClient.search.byType.query({
        q: query,
        type: BY_TYPE_INPUT[type],
        page,
        n: PAGE_SIZE,
      }),
    itemsOf: (page): readonly SearchEntry[] => page.results,
    hasMore: (lastPage, pages) => pages.length * PAGE_SIZE < lastPage.total,
    keyOf: (entry) => entry.id,
  });

  return {
    entries: list.items,
    status: statusOf(list.items.length, list.isPending, list.error),
    error: list.error,
    isFetchingNextPage: list.isFetchingNextPage,
    hasNextPage: list.hasNextPage,
    loadMore: list.loadMore,
    retry: () => void list.refetch(),
  };
}

function statusOf(
  count: number,
  isPending: boolean,
  error: unknown,
): TypeResultsStatus {
  if (count > 0) return "ready";
  if (isPending) return "loading";
  if (error && getErrorCode(error) !== "NOT_FOUND") return "error";
  return "empty";
}
