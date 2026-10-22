import type { MediaType } from "@infinitunes/types";

import { queryClient } from "~/lib/query-client";
import { trpc } from "~/lib/trpc";
import { routeOf } from "~/navigation/entity-href";

/** Songs and albums the artist payload carries: the Overview's rows, the Play queue and the albums shelf. */
export const ARTIST_INITIAL_ITEMS = 50;

/**
 * The primary query of each detail screen, shared by the screen's hook and
 * the press-in prefetch so both hit the same cache entry.
 */
export const entityQueries = {
  album: (token: string) => trpc.album.details.queryOptions({ token }),
  artist: (token: string) =>
    trpc.artist.details.queryOptions({
      token,
      n_song: ARTIST_INITIAL_ITEMS,
      n_album: ARTIST_INITIAL_ITEMS,
    }),
  playlist: (token: string) => trpc.playlist.details.queryOptions({ token }),
  show: (token: string) => trpc.show.details.queryOptions({ token }),
  song: (token: string) => trpc.song.details.queryOptions({ token }),
};

/**
 * Warms the cache for the detail screen an item opens, so the screen starts
 * with its data (a no-op for a type without a prefetched screen; failures are
 * swallowed by `prefetchQuery`).
 */
export function prefetchEntity(type: MediaType, url: string): void {
  const route = routeOf(type, url);
  if (!route) return;
  if (route.kind === "artist") {
    void queryClient.prefetchQuery(entityQueries.artist(route.token));
  } else if (route.kind === "show") {
    void queryClient.prefetchQuery(entityQueries.show(route.token));
  } else if (route.type === "album") {
    void queryClient.prefetchQuery(entityQueries.album(route.token));
  } else if (route.type === "playlist") {
    void queryClient.prefetchQuery(entityQueries.playlist(route.token));
  } else if (route.type === "song") {
    void queryClient.prefetchQuery(entityQueries.song(route.token));
  }
}
