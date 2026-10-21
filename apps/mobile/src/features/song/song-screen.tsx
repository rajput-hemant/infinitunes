import { decode, parseToken, toSongRow } from "@infinitunes/types";
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

import { EntityHeader } from "~/components/entity-header";
import { Shelf } from "~/components/shelf";
import { SongListSkeleton } from "~/components/skeletons";
import { trpc } from "~/lib/trpc";

import { artistCards, cardItemsOf } from "./cards";
import { DetailScreen } from "./detail-screen";
import { DetailSkeleton } from "./detail-skeleton";
import { LyricsSection } from "./lyrics-section";
import { joinMeta } from "./meta";
import { playAll, shuffleAll } from "./play-collection";
import { SecondaryShelf } from "./secondary-shelf";
import { SectionHeading } from "./section-heading";
import { SongCredits } from "./song-credits";
import { TrackList } from "./track-list";

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
    ...trpc.song.details.queryOptions({ token }),
    select: selectSong,
  });
  // Independent of the song: starts with it instead of after it.
  const trending = useQuery({
    ...trpc.get.trending.queryOptions({ type: "song" }),
    select: cardItemsOf,
  });

  return (
    <DetailScreen
      query={query}
      skeleton={<DetailSkeleton rows={1} />}
      noun="song"
      refreshKeys={[
        trpc.get.lyrics.pathKey(),
        trpc.album.details.pathKey(),
        trpc.song.recommendations.pathKey(),
        trpc.get.trending.pathKey(),
        trpc.artist.topSongs.pathKey(),
        trpc.get.actorTopSongs.pathKey(),
      ]}
      identity={({ song }) => ({
        name: decode(song.title),
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
  const recommendations = useQuery({
    ...trpc.song.recommendations.queryOptions({ id: song.id }),
    select: cardItemsOf,
  });

  return (
    <>
      <EntityHeader
        image={song.image}
        title={row.name}
        subtitle={joinMeta([
          row.album,
          row.primaryArtists.map((artist) => artist.name).join(", "),
        ])}
        onPlay={() => playAll(rows)}
        onShuffle={() => shuffleAll(rows)}
        like={{ type: "song", token: song.id }}
      />
      {info.has_lyrics === "true" ? <LyricsSection songId={song.id} /> : null}
      <SongCredits song={song} />
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

  if (isPending && token !== "") return <SongListSkeleton rows={4} />;
  if (rows.length === 0) return null;

  return (
    <>
      <SectionHeading>{`More from ${song.album ?? "the album"}`}</SectionHeading>
      <TrackList rows={rows} />
    </>
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
    select: cardItemsOf,
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
    select: cardItemsOf,
  });
  return <SecondaryShelf title={section.title} query={query} />;
}
