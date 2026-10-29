import {
  artistCards,
  decode,
  isExplicit,
  parseToken,
  toCardItems,
  toSongRow,
} from "@infinitunes/types";
import type {
  CardItem,
  Song,
  SongModules,
  SongObj,
  SongRowItem,
} from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import Animated from "react-native-reanimated";

import { DeferredDetails } from "~/components/deferred-details";
import { DetailScreen } from "~/components/detail/detail-screen";
import { EntityHeader } from "~/components/entity-header";
import { SecondaryShelf } from "~/components/secondary-shelf";
import { SectionHeader } from "~/components/section-header";
import { Shelf } from "~/components/shelf";
import {
  CONTENT_REVEAL,
  EntityHeaderSkeleton,
  LyricsSkeleton,
  SectionHeaderSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";
import { TrackList } from "~/components/track-list";
import { entityQueries } from "~/lib/entity-queries";
import { joinMeta } from "~/lib/meta";
import { trpc } from "~/lib/trpc";
import { useOpenCredits, useOpenEntity } from "~/navigation/use-open-entity";
import { playAll } from "~/playback/play-collection";

import { LyricsSection } from "./lyrics-section";

type SongDetails = { song: Song; modules: SongModules | undefined };

/**
 * The song a details payload is about. Upstream answers an empty `songs`
 * list, or an episode, for a token that is not a song: both are missing.
 */
function selectSong(data: SongObj): SongDetails | null {
  const [song] = data.songs;
  return song?.type === "song" ? { song, modules: data.modules } : null;
}

function hasStarringArtist(song: Song): boolean {
  return (
    song.more_info.artistMap?.artists?.some(
      (artist) => artist.role === "starring",
    ) ?? false
  );
}

type SongScreenProps = {
  token: string;
};

export function SongScreen({ token }: SongScreenProps) {
  const query = useQuery({
    ...entityQueries.song(token),
    select: selectSong,
  });
  // Independent of the song: starts with it instead of after it.
  const trending = useQuery({
    ...trpc.get.trending.queryOptions({ type: "song" }),
    select: toCardItems,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={
        // The header, then the lyrics section's own loading lines, which
        // `LyricsSection` keeps showing until the lyrics arrive.
        <>
          <EntityHeaderSkeleton shuffle={false} />
          <LyricsSkeleton />
        </>
      }
      noun="Song"
      icon={{ ios: "music.note", android: "music_note" }}
      refreshKeys={[
        trpc.song.syncedLyrics.pathKey(),
        trpc.album.details.pathKey(),
        trpc.song.recommendations.pathKey(),
        trpc.get.trending.pathKey(),
        trpc.artist.topSongs.pathKey(),
        trpc.get.actorTopSongs.pathKey(),
      ]}
      identity={({ song }) => ({
        name: decode(song.title),
        type: song.type,
        url: song.perma_url,
      })}
    >
      {({ song, modules }) => (
        <SongPage song={song} modules={modules} trending={trending} />
      )}
    </DetailScreen>
  );
}

type SongPageProps = SongDetails & {
  trending: UseQueryResult<CardItem[], unknown>;
};

function SongPage({ song, modules, trending }: SongPageProps) {
  const row = useMemo(() => toSongRow(song), [song]);
  const rows = useMemo(() => [row], [row]);
  const { more_info: info } = song;
  const openCredits = useOpenCredits();
  const openEntity = useOpenEntity();
  // One credited artist: the credit opens their screen.
  const soleArtist =
    row.primaryArtists.length === 1 ? row.primaryArtists[0] : undefined;
  const recommendations = useQuery({
    ...trpc.song.recommendations.queryOptions({ id: song.id }),
    select: toCardItems,
  });

  return (
    <>
      <EntityHeader
        image={song.image}
        eyebrow={joinMeta(["Song", song.year])}
        title={row.name}
        subtitle={row.primaryArtists.map((artist) => artist.name).join(", ")}
        meta={row.album}
        explicit={isExplicit(song.explicit_content)}
        onPlay={() => playAll(rows)}
        like={{ type: "song", token: song.id }}
        onSubtitlePress={
          soleArtist
            ? () => openEntity("artist", soleArtist.perma_url)
            : undefined
        }
        menu={{
          rows,
          extra: [
            {
              id: "credits",
              title: "View Credits",
              image: "info.circle",
              run: () => openCredits(song.perma_url),
            },
          ],
        }}
      />
      <DeferredDetails>
        <LyricsSection songId={song.id} />
        <MoreFromAlbum song={row} albumUrl={info.album_url} />
        <SecondaryShelf
          title={modules?.reco?.title ?? "Recommended Songs"}
          query={recommendations}
        />
        <SecondaryShelf
          title={modules?.currentlyTrending?.title ?? "Trending"}
          query={trending}
        />
        {modules?.songsBysameArtists ? (
          <SameArtistsShelf section={modules.songsBysameArtists} />
        ) : null}
        {modules?.songsBysameActors && hasStarringArtist(song) ? (
          <SameActorsShelf section={modules.songsBysameActors} />
        ) : null}
        <Shelf
          title={modules?.artists?.title ?? "Artists"}
          items={artistCards(info.artistMap?.artists ?? [])}
        />
      </DeferredDetails>
    </>
  );
}

type MoreFromAlbumProps = {
  song: SongRowItem;
  albumUrl: string;
};

/** The rest of the song's album, as playable rows. */
function MoreFromAlbum({ song, albumUrl }: MoreFromAlbumProps) {
  const token = parseToken(albumUrl);
  const { data, isPending } = useQuery({
    ...trpc.album.details.queryOptions({ token }),
    enabled: token !== "",
  });
  const rows = useMemo(
    () =>
      (Array.isArray(data?.list) ? data.list : [])
        .filter((item) => item.id !== song.id)
        .map(toSongRow),
    [data, song.id],
  );

  if (isPending && token !== "") {
    return (
      <>
        <SectionHeaderSkeleton />
        <SongListSkeleton rows={4} />
      </>
    );
  }
  if (rows.length === 0) return null;

  return (
    <Animated.View entering={CONTENT_REVEAL} testID="more-from-album-reveal">
      <SectionHeader title={`More from ${song.album ?? "the album"}`} />
      <TrackList rows={rows} />
    </Animated.View>
  );
}

type SameArtistsShelfProps = {
  section: SongModules["songsBysameArtists"];
};

function SameArtistsShelf({ section }: SameArtistsShelfProps) {
  const { artist_ids, song_id, language } = section.source_params;
  const query = useQuery({
    ...trpc.artist.topSongs.queryOptions({
      artist_id: artist_ids,
      song_id,
      lang: language,
    }),
    select: toCardItems,
  });
  return <SecondaryShelf title={section.title} query={query} />;
}

type SameActorsShelfProps = {
  section: SongModules["songsBysameActors"];
};

function SameActorsShelf({ section }: SameActorsShelfProps) {
  const { actor_ids, song_id, language } = section.source_params;
  const query = useQuery({
    ...trpc.get.actorTopSongs.queryOptions({
      actor_id: actor_ids,
      song_id,
      lang: language,
    }),
    select: toCardItems,
  });
  return <SecondaryShelf title={section.title} query={query} />;
}
