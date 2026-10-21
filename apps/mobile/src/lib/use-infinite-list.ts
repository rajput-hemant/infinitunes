import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";

type InfiniteListOptions<Page, Item> = {
  /** Unique per list and input, e.g. `[...trpc.get.topAlbums.pathKey(), { lang }]`. */
  queryKey: QueryKey;
  /** Fetches one 1-based page, e.g. `(page) => trpcClient.get.topAlbums.query({ page, lang })`. */
  fetchPage: (page: number) => Promise<Page>;
  /** The items of one page. */
  itemsOf: (page: Page) => readonly Item[];
  /** Whether a page after `lastPage` exists (e.g. `!lastPage.last_page`). */
  hasMore: (lastPage: Page, pages: readonly Page[]) => boolean;
  /** Upstream repeats items across pages; the first one per key is kept. */
  keyOf: (item: Item) => string;
  /** The first page number: catalog lists count from 1, a few upstream lists from 0. */
  firstPage?: number;
  /** `false` keeps the list idle (e.g. a tab that is not on screen). */
  enabled?: boolean;
};

/**
 * A paged catalog list on TanStack Query. The catalog procedures take a
 * `page`, not a cursor, so this pages by number from `firstPage`. `data.pages` is one array
 * per page (`Page[]`, i.e. `Item[][]`): `items` is them flattened and
 * deduplicated, ready for a `FlashList` with `onEndReached={loadMore}`.
 */
export function useInfiniteList<Page, Item>({
  queryKey,
  fetchPage,
  itemsOf,
  hasMore,
  keyOf,
  firstPage = 1,
  enabled,
}: InfiniteListOptions<Page, Item>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: firstPage,
    enabled,
    getNextPageParam: (lastPage, pages, lastPageParam) =>
      hasMore(lastPage, pages) ? lastPageParam + 1 : undefined,
  });

  const items = uniqueBy(query.data?.pages.flatMap(itemsOf) ?? [], keyOf);

  function loadMore() {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }

  return { ...query, items, loadMore };
}
