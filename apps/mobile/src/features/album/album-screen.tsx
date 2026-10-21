import {
  artistCards,
  decode,
  toCardItems,
  uniqueArtists,
} from "@infinitunes/types";
import type { Album, CardItem, SongRowItem } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { View } from "react-native";

import { CollectionMenu } from "~/components/collection-menu";
import { DetailScreen } from "~/components/detail/detail-screen";
import { DetailSkeleton } from "~/components/detail/detail-skeleton";
import { EntityHeader } from "~/components/entity-header";
import { SecondaryShelf } from "~/components/secondary-shelf";
import { Shelf } from "~/components/shelf";
import { TrackList } from "~/components/track-list";
import { Text } from "~/components/ui/text";
import {
  joinMeta,
  playsLabel,
  songCountLabel,
  totalDurationLabel,
} from "~/lib/meta";
import { songRowsOf } from "~/lib/song-rows";
import { trpc } from "~/lib/trpc";
import { playAll, shuffleAll } from "~/playback/play-collection";

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
    select: toCardItems,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton />}
      noun="Album"
      icon={{ ios: "square.stack", android: "album" }}
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
    select: toCardItems,
  });
  const sameYear = useQuery({
    ...trpc.album.sameYear.queryOptions({ year: `${album.year}` }),
    select: toCardItems,
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
        actions={<CollectionMenu name={decode(album.title)} rows={rows} />}
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
        title={modules?.reco?.title ?? "Recommended Albums"}
        query={recommendations}
      />
      <SecondaryShelf
        title={modules?.currentlyTrending?.title ?? "Trending"}
        query={trending}
      />
      <SecondaryShelf
        title={modules?.topAlbumsFromSameYear?.title ?? "Albums From Same Year"}
        query={sameYear}
      />
      <Shelf
        title={modules?.artists?.title ?? "Artists"}
        items={artistCards(album.more_info.artistMap?.artists ?? [])}
      />
    </>
  );
}
