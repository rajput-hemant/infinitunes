import {
  type ArtistPage,
  categorySort,
  isDefaultCategory,
  toArtistPage,
} from "@infinitunes/core/artist-pagination";
import type { Category } from "@infinitunes/types";
import { useCallback } from "react";

import { trpc, trpcClient } from "~/lib/trpc";
import { useInfiniteList } from "~/lib/use-infinite-list";

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
  const itemsOf = useCallback(
    (page: ArtistPage<Raw>) => page.items.map(toItem),
    [toItem],
  );
  return useInfiniteList({
    queryKey: [
      ...trpc.artist[source].pathKey(),
      { id: artistId, cat: category },
    ],
    firstPage: 0,
    enabled,
    fetchPage: async (page) => {
      const request = {
        id: artistId,
        page,
        cat: isDefaultCategory(category) ? undefined : category,
        sort: categorySort(category),
      };
      const result =
        source === "songs"
          ? await trpcClient.artist.songs.query(request)
          : await trpcClient.artist.albums.query(request);
      const { section, list } = SECTIONS[source];
      return toArtistPage<Raw>(result, section, list);
    },
    itemsOf,
    hasMore: (lastPage) => !lastPage.last_page,
    keyOf,
  });
}
