import { decode, uniqueArtists } from "@infinitunes/types";
import type { Album, CardItem, SongRowItem } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { View } from "react-native";

import { EntityHeader } from "~/components/entity-header";
import { Shelf } from "~/components/shelf";
import { Text } from "~/components/ui/text";
import { artistCards, cardItemsOf } from "~/features/song/cards";
import { DetailScreen } from "~/features/song/detail-screen";
import { DetailSkeleton } from "~/features/song/detail-skeleton";
import {
  joinMeta,
  playsLabel,
  songCountLabel,
  totalDurationLabel,
} from "~/features/song/meta";
import { playAll, shuffleAll } from "~/features/song/play-collection";
import { SecondaryShelf } from "~/features/song/secondary-shelf";
import { songRowsOf } from "~/features/song/song-rows";
import { TrackList } from "~/features/song/track-list";
import { trpc } from "~/lib/trpc";

type AlbumScreenProps = {
  token: string;
};

function albumMeta(album: Album, rows: readonly SongRowItem[]): string {
  const artists = uniqueArtists(album.more_info.artistMap?.artists ?? []);
  return joinMeta([
    artists.length > 0
      ? artists.map((artist) => decode(artist.name)).join(", ")
      : decode(album.subtitle),
    songCountLabel(rows.length),
    playsLabel(album.play_count),
    totalDurationLabel(rows),
  ]);
}

export function AlbumScreen({ token }: AlbumScreenProps) {
  const query = useQuery(trpc.album.details.queryOptions({ token }));
  // Independent of the album: starts with it instead of after it.
  const trending = useQuery({
    ...trpc.get.trending.queryOptions({ type: "album" }),
    select: cardItemsOf,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton />}
      noun="album"
      refreshKeys={[
        trpc.album.recommendations.pathKey(),
        trpc.album.sameYear.pathKey(),
        trpc.get.trending.pathKey(),
      ]}
      identity={(album) => ({
        name: decode(album.title),
        url: album.perma_url,
      })}
    >
      {(album) => <AlbumPage album={album} trending={trending} />}
    </DetailScreen>
  );
}

type AlbumPageProps = {
  album: Album;
  trending: UseQueryResult<CardItem[], unknown>;
};

function AlbumPage({ album, trending }: AlbumPageProps) {
  const rows = useMemo(() => songRowsOf(album.list), [album]);
  const recommendations = useQuery({
    ...trpc.album.recommendations.queryOptions({ id: album.id }),
    select: cardItemsOf,
  });
  const sameYear = useQuery({
    ...trpc.album.sameYear.queryOptions({ year: `${album.year}` }),
    select: cardItemsOf,
  });
  const { modules } = album;
  const { copyright_text: copyright } = album.more_info;

  return (
    <>
      <EntityHeader
        image={album.image}
        title={decode(album.title)}
        subtitle={albumMeta(album, rows)}
        onPlay={() => playAll(rows)}
        onShuffle={() => shuffleAll(rows)}
        like={{ type: "album", token: album.id }}
      />
      <TrackList rows={rows} />
      {copyright ? (
        <View className="px-page py-3">
          <Text variant="caption" tone="muted">
            {decode(copyright)}
          </Text>
        </View>
      ) : null}
      <SecondaryShelf
        title={modules?.reco.title ?? "Recommended Albums"}
        query={recommendations}
      />
      <SecondaryShelf
        title={modules?.currentlyTrending.title ?? "Trending"}
        query={trending}
      />
      <SecondaryShelf
        title={modules?.topAlbumsFromSameYear.title ?? "Albums From Same Year"}
        query={sameYear}
      />
      <Shelf
        title={modules?.artists.title ?? "Artists"}
        items={artistCards(album.more_info.artistMap?.artists ?? [])}
      />
    </>
  );
}
