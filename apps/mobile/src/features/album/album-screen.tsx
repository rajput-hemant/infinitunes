import {
  artistCards,
  decode,
  isExplicit,
  toCardItems,
  uniqueArtists,
} from "@infinitunes/types";
import type { Album, CardItem, SongRowItem } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { View } from "react-native";

import { DeferredDetails } from "~/components/deferred-details";
import { DetailScreen } from "~/components/detail/detail-screen";
import { DetailSkeleton } from "~/components/detail/detail-skeleton";
import { EntityHeader } from "~/components/entity-header";
import { SecondaryShelf } from "~/components/secondary-shelf";
import { Shelf } from "~/components/shelf";
import { TrackListPage } from "~/components/track-list";
import { Text } from "~/components/ui/text";
import { entityQueries } from "~/lib/entity-queries";
import {
  joinMeta,
  playsLabel,
  songCountLabel,
  totalDurationLabel,
} from "~/lib/meta";
import { songRowsOf } from "~/lib/song-rows";
import { trpc } from "~/lib/trpc";
import { useOpenEntity } from "~/navigation/use-open-entity";
import { playAll, shuffleAll } from "~/playback/play-collection";

type AlbumScreenProps = {
  token: string;
};

/** The album's artists, or upstream's own credit line without them. */
function albumCredit(album: Album): string {
  const artists = uniqueArtists(album.more_info.artistMap?.artists ?? []);
  return artists.length > 0
    ? artists.map((artist) => decode(artist.name)).join(", ")
    : decode(album.subtitle);
}

function albumMeta(album: Album, rows: readonly SongRowItem[]): string {
  return joinMeta([
    songCountLabel(rows.length),
    totalDurationLabel(rows),
    playsLabel(album.play_count),
  ]);
}

export function AlbumScreen({ token }: AlbumScreenProps) {
  const query = useQuery(entityQueries.album(token));
  // Independent of the album: starts with it instead of after it.
  const trending = useQuery({
    ...trpc.get.trending.queryOptions({ type: "album" }),
    select: toCardItems,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton numbered />}
      noun="Album"
      list
      icon={{ ios: "square.stack", android: "album" }}
      refreshKeys={[
        trpc.album.recommendations.pathKey(),
        trpc.album.sameYear.pathKey(),
        trpc.get.trending.pathKey(),
      ]}
      identity={(album) => ({
        name: decode(album.title),
        type: "album",
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
  const openEntity = useOpenEntity();
  // One credited artist: the credit opens their screen.
  const artists = uniqueArtists(album.more_info.artistMap?.artists ?? []);
  const soleArtist = artists.length === 1 ? artists[0] : undefined;

  return (
    <TrackListPage
      rows={rows}
      numbered
      header={
        <EntityHeader
          image={album.image}
          eyebrow={joinMeta(["Album", album.year])}
          title={decode(album.title)}
          subtitle={albumCredit(album)}
          onSubtitlePress={
            soleArtist
              ? () => openEntity("artist", soleArtist.perma_url)
              : undefined
          }
          meta={albumMeta(album, rows)}
          explicit={isExplicit(album.explicit_content)}
          onPlay={() => playAll(rows)}
          onShuffle={() => shuffleAll(rows)}
          like={{ type: "album", token: album.id }}
          menu={{ rows }}
        />
      }
      footer={
        <DeferredDetails>
          <AlbumFooter album={album} trending={trending} />
        </DeferredDetails>
      }
    />
  );
}

/** Under the songs: the copyright line, then the album's shelves. */
function AlbumFooter({ album, trending }: AlbumPageProps) {
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
      {copyright ? (
        <View className="px-page pt-4">
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
