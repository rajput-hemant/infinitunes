/**
 * Upstream `getArtistMoreSong`/`getArtistMoreAlbum` use 0-based pages of 10 raw
 * items. The artist page already holds the first `ARTIST_INITIAL_ITEMS`
 * (`n_song`/`n_album` in `artist/[name]/[token]/page.tsx`), i.e. pages 0-4, so
 * the first page worth fetching is 5; refetching 1-4 only returns duplicates.
 */
export const ARTIST_INITIAL_ITEMS = 50;
const ARTIST_PAGE_SIZE = 10;
export const ARTIST_LAST_INITIAL_PAGE =
  ARTIST_INITIAL_ITEMS / ARTIST_PAGE_SIZE - 1;

export type ArtistPage<T> = { items: T[]; last_page: boolean };

/**
 * The raw result nests the list under `topSongs`/`topAlbums`. Upstream keeps
 * `last_page` false even past the end (an empty page), so an empty page ends
 * pagination too.
 */
export function toArtistPage<T>(
  result: unknown,
  key: "topSongs" | "topAlbums",
  listKey: "songs" | "albums",
): ArtistPage<T> {
  const section = (result as Record<string, unknown> | null)?.[key] as
    | Record<string, unknown>
    | undefined;
  const items = (section?.[listKey] as T[] | undefined) ?? [];
  return {
    items,
    last_page: section?.last_page === true || items.length === 0,
  };
}

export function nextArtistPage(
  page: { last_page: boolean },
  lastPageParam: number,
) {
  return page.last_page ? null : lastPageParam + 1;
}

/**
 * `cat` values other than the default popularity order are fetched from page 0:
 * the artist payload's own `topSongs`/`topAlbums` are always in popularity
 * order, so they cannot seed a re-sorted list.
 */
export function isDefaultCategory(cat: string | undefined) {
  return cat === undefined || cat === "popularity";
}

/** The `sort_order` upstream expects for a category: newest first, otherwise ascending. */
export function categorySort(cat: string | undefined) {
  return cat === "latest" ? "desc" : "asc";
}
