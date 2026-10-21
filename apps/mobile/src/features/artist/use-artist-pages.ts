import {
  categorySort,
  isDefaultCategory,
  nextArtistPage,
  toArtistPage,
} from "@infinitunes/core/artist-pagination";
import type { Category } from "@infinitunes/types";
import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";

import { trpc, trpcClient } from "~/lib/trpc";

type ArtistSource = "songs" | "albums";

const SECTIONS = {
  songs: { section: "topSongs", list: "songs" },
  albums: { section: "topAlbums", list: "albums" },
} as const;

type ArtistPagesOptions<Raw, Item> = {
  artistId: string;
  source: ArtistSource;
  category: Category;
  toItem: (raw: Raw) => Item;
  keyOf: (item: Item) => string;
  /** Only the visible tab loads; the others stay idle. */
  enabled: boolean;
};

/**
 * One tab's songs or albums, paged from upstream page 0 (the 0-based pages
 * of `artist.songs`/`artist.albums`) in the chosen order. The first page is
 * fetched, not seeded from the artist payload: a pull to refresh refetches
 * every page from the first param, which would swap a seeded first page for
 * a later one.
 */
export function useArtistPages<Raw, Item>({
  artistId,
  source,
  category,
  toItem,
  keyOf,
  enabled,
}: ArtistPagesOptions<Raw, Item>) {
  const query = useInfiniteQuery({
    queryKey: [
      ...trpc.artist[source].pathKey(),
      { id: artistId, cat: category },
    ],
    queryFn: async ({ pageParam }) => {
      const request = {
        id: artistId,
        page: pageParam,
        cat: isDefaultCategory(category) ? undefined : category,
        sort: categorySort(category),
      };
      const result =
        source === "songs"
          ? await trpcClient.artist.songs.query(request)
          : await trpcClient.artist.albums.query(request);
      const { section, list } = SECTIONS[source];
      const page = toArtistPage<Raw>(result, section, list);
      return { items: page.items.map(toItem), last_page: page.last_page };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      nextArtistPage(lastPage, lastPageParam),
    enabled,
  });

  const items = uniqueBy(
    query.data?.pages.flatMap((page) => page.items) ?? [],
    keyOf,
  );

  function loadMore() {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }

  return { ...query, items, loadMore };
}
