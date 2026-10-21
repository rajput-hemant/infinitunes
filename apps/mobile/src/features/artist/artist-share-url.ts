import type { Artist } from "@infinitunes/types";

/**
 * An artist has no `perma_url`, only one URL per tab, whose name slug ends
 * in the tab (`flipperachi-songs`). The web app lands that on its Songs
 * tab; without the suffix it is the Overview, which is what the screen opens on.
 */
export function artistShareUrl(artist: Artist): string {
  return artist.urls.songs.replace(/-songs(?=\/[^/]+$)/, "");
}
