import { parseArtistBio } from "@infinitunes/types";
import { cache } from "react";

import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

/**
 * The artist payload, memoized per request: the layout (metadata, header, tab
 * row, shelves) and the active tab's page all read it, and the catalog call
 * underneath is cached, so a tab switch is a cache hit.
 */
export const getArtist = cache(async (token: string) =>
  orNotFound(api.artist.details({ token, n_song: 50, n_album: 50 })),
);

export type ArtistDetails = Awaited<ReturnType<typeof getArtist>>;

export function artistBio(artist: ArtistDetails) {
  return parseArtistBio(artist.bio);
}
