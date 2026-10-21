import {
  artistPath,
  splitArtistSlug,
  type ArtistTab,
} from "@infinitunes/core/entity-route";
import { getImageSrc, parseArtistBio } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache } from "react";

import { pageMetadata } from "~/lib/metadata";
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

type SubTab = Exclude<ArtistTab, "overview">;

const TAB_TITLES = { songs: "Songs", albums: "Albums" } as const;

/**
 * Metadata for a tab route. Each tab is its own canonical page (it overrides
 * the layout's Overview canonical) and gets its own title, so the tabs no
 * longer share the artist's name and listener count.
 */
export function artistTabMetadata(
  artist: ArtistDetails,
  name: string,
  token: string,
  tab: SubTab,
): Metadata {
  const artistName = artist.name;
  const title =
    tab === "bio"
      ? `Biography of ${artistName}`
      : `${TAB_TITLES[tab]} by ${artistName}`;

  return pageMetadata({
    title,
    description: `${title} on Infinitunes.`,
    url: artistPath(splitArtistSlug(name).name, token, tab),
    image: getImageSrc(artist.image, "high"),
    square: true,
  });
}
