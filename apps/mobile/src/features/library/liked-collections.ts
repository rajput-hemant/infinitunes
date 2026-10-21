import type { FavoriteLists } from "@infinitunes/core/favorites";
import type { Artist, CardItem } from "@infinitunes/types";
import { parseToken, toArtistCard, toCardItem } from "@infinitunes/types";
import type { Href } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";

import { trpcClient } from "~/lib/trpc";

export type LikedCollectionKind = "albums" | "artists" | "playlists" | "shows";

type LikedCollection = {
  title: string;
  /** Copy for the empty state: what to tap to fill the list. */
  emptyMessage: string;
  column: keyof FavoriteLists;
  href: Href;
  icon: SymbolViewProps["name"];
  /** The card for one saved token; `undefined` when upstream no longer has it. */
  resolve: (token: string) => Promise<CardItem | undefined>;
};

/** A saved artist's card opens the artist screen, whose token is the songs URL's. */
export function artistDetailsCard(
  artist: Pick<Artist, "artistId" | "name" | "subtitle" | "image" | "urls">,
): CardItem {
  return toArtistCard({
    id: artist.artistId,
    name: artist.name,
    perma_url: artist.urls.songs,
    subtitle: artist.subtitle,
    image: artist.image,
  });
}

/** A saved podcast is a show's id; its details are found through an episode. */
async function resolveShow(id: string): Promise<CardItem | undefined> {
  const episodes = await trpcClient.show.episodes.query({ id });
  const showUrl = episodes[0]?.more_info.show_url;
  if (!showUrl) return undefined;
  const show = await trpcClient.show.details.query({
    token: parseToken(showUrl),
  });
  return toCardItem(show.show_details);
}

export const LIKED_COLLECTIONS: Record<LikedCollectionKind, LikedCollection> = {
  albums: {
    title: "Liked Albums",
    emptyMessage: "Tap the heart on an album and it will show up here.",
    column: "albums",
    href: "/me/albums",
    icon: { ios: "square.stack", android: "album" },
    resolve: async (id) =>
      toCardItem(await trpcClient.album.details.query({ id })),
  },
  artists: {
    title: "Liked Artists",
    emptyMessage: "Tap the heart on an artist and it will show up here.",
    column: "artists",
    href: "/me/artists",
    icon: { ios: "music.mic", android: "mic" },
    resolve: async (id) =>
      artistDetailsCard(await trpcClient.artist.details.query({ id })),
  },
  playlists: {
    title: "Liked Playlists",
    emptyMessage: "Tap the heart on a playlist and it will show up here.",
    column: "playlists",
    href: "/me/playlists",
    icon: { ios: "music.note.list", android: "queue_music" },
    resolve: async (id) =>
      toCardItem(await trpcClient.playlist.details.query({ id })),
  },
  shows: {
    title: "Liked Podcasts",
    emptyMessage: "Tap the heart on a podcast and it will show up here.",
    column: "podcasts",
    href: "/me/shows",
    icon: { ios: "mic.circle", android: "podcasts" },
    resolve: resolveShow,
  },
};
