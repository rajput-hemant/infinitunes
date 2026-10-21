import { formatCount, uniqueBy } from "@infinitunes/types";
import type { CardItem, TopArtists } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";

import { MediaCard } from "~/components/media-card";
import { trpc } from "~/lib/trpc";

import { CATALOG_PAGE_SIZE } from "./catalog-page-size";
import { CatalogScreen } from "./catalog-screen";

type TopArtist = TopArtists["top_artists"][number];

/** The artist list items carry `name` and `artistid`, not the `title`/`type` of other lists. */
function toArtistCard(artist: TopArtist): CardItem {
  return {
    id: artist.artistid,
    name: artist.name,
    url: artist.perma_url,
    subtitle: `${formatCount(artist.follower_count)} Fans`,
    type: "artist",
    image: artist.image,
  };
}

const selectArtists = (data: TopArtists) =>
  uniqueBy(data.top_artists ?? [], (artist) => artist.artistid).map(
    toArtistCard,
  );

/** The most followed artists. */
export function TopArtistsScreen() {
  const artists = useQuery({
    ...trpc.get.topArtists.queryOptions({ page: 1, n: CATALOG_PAGE_SIZE }),
    select: selectArtists,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Top Artists" }} />
      <CatalogScreen
        query={{ ...artists, items: artists.data ?? [] }}
        keyOf={(artist) => artist.id}
        renderCard={(artist, width) => (
          <MediaCard item={artist} width={width} />
        )}
        empty={{
          icon: { ios: "person.2", android: "group" },
          title: "No artists yet",
          message: "Check back later for the top artists.",
        }}
      />
    </>
  );
}
