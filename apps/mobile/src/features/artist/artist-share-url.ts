import { artistPath, entityRoute } from "@infinitunes/core/entity-route";
import type { Artist } from "@infinitunes/types";

/**
 * An artist has no `perma_url`, only one URL per tab, whose name slug ends
 * in the tab (`flipperachi-songs`). The screen opens on the Overview, so
 * that is the page it shares.
 */
export function artistShareUrl(artist: Artist): string {
  const route = entityRoute(artist.urls.songs, "artist");
  return route?.kind === "artist"
    ? artistPath(route.name, route.token, "overview")
    : artist.urls.songs;
}
