import { getImageSrc, parseToken, toCardItem } from "@infinitunes/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SliderListSkeleton } from "~/components/skeletons/slider-list-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";
import { SliderList } from "~/components/slider/slider-list";
import { SongList } from "~/components/song-list/song-list";
import { orFallback } from "~/lib/degrade";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

import { Lyrics } from "./_components/lyrics";

type TrendingSongs = Awaited<ReturnType<typeof api.get.trending>>;

const getSong = cache(async (token: string) => {
  const data = await orNotFound(api.song.details({ token }));
  const song = data.songs[0];
  if (song?.type !== "song") notFound();
  return { song, modules: data.modules };
});

type SongDetails = Awaited<ReturnType<typeof getSong>>["song"];

function hasStarringArtist(song: SongDetails) {
  return (
    song.more_info.artistMap?.artists?.some(
      (artist) => artist.role === "starring",
    ) ?? false
  );
}

type TokenProps = { token: string };

type SongDetailsPageProps = {
  params: Promise<{
    name: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: SongDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const { song } = await getSong(token);

  return pageMetadata({
    title: song.title,
    description: song.subtitle,
    url: `/song/${name}/${token}`,
    image: getImageSrc(song.image, "high"),
    square: true,
  });
}
type SongLyricsProps = { id: string };

async function SongLyrics({ id }: SongLyricsProps) {
  const lyrics = await orFallback("lyrics", api.get.lyrics({ id }), undefined);
  return lyrics ? <Lyrics lyrics={lyrics} /> : null;
}

async function SongAlbumSongs({ token }: TokenProps) {
  const { song } = await getSong(token);
  const album = await orFallback(
    "album songs",
    api.album.details({ token: parseToken(song.more_info.album_url) }),
    undefined,
  );
  const songs = Array.isArray(album?.list)
    ? album.list.filter((item) => item.id !== song.id)
    : [];
  return songs.length ? (
    <section className="flex flex-col gap-4">
      <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
        More from {song.more_info.album}
      </h2>
      <SongList items={songs} />
    </section>
  ) : null;
}

async function SongRecommendations({ token }: TokenProps) {
  const { song, modules } = await getSong(token);
  const items = await orFallback(
    "recommendations",
    api.song.recommendations({ id: song.id }),
    [],
  );
  return items.length ? (
    <SliderList
      title={modules?.reco?.title ?? "Recommended Songs"}
      items={items.map(toCardItem)}
    />
  ) : null;
}

type SongTrendingProps = TokenProps & {
  trending: Promise<TrendingSongs>;
};

async function SongTrending({ token, trending }: SongTrendingProps) {
  const [{ modules }, items] = await Promise.all([getSong(token), trending]);
  return items.length ? (
    <SliderList
      title={modules?.currentlyTrending?.title ?? "Trending"}
      items={items.map(toCardItem)}
    />
  ) : null;
}

async function SongSameArtists({ token }: TokenProps) {
  const { modules } = await getSong(token);
  const section = modules?.songsBysameArtists;
  if (!section) return null;
  const params = section.source_params;
  const items = await orFallback(
    "songs from the same artists",
    api.artist.topSongs({
      artist_id: params.artist_ids,
      song_id: params.song_id,
      lang: params.language,
    }),
    [],
  );
  return items.length ? (
    <SliderList title={section.title} items={items.map(toCardItem)} />
  ) : null;
}

async function SongSameActors({ token }: TokenProps) {
  const { song, modules } = await getSong(token);
  const section = modules?.songsBysameActors;
  if (!section || !hasStarringArtist(song)) return null;
  const params = section.source_params;
  const items = await orFallback(
    "songs from the same actors",
    api.get.actorTopSongs({
      actor_id: params.actor_ids,
      song_id: params.song_id,
      lang: params.language,
    }),
    undefined,
  );
  return items?.length ? (
    <SliderList title={section.title} items={items.map(toCardItem)} />
  ) : null;
}

export default async function SongDetailsPage(props: SongDetailsPageProps) {
  const { token } = await props.params;

  // Trending does not depend on the song; start it before the song resolves.
  // orFallback never rejects, so an early notFound() leaves nothing unhandled.
  const trending = orFallback(
    "trending",
    api.get.trending({ type: "song" }),
    [],
  );
  const { song, modules } = await getSong(token);

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeader item={song} />

      {song.more_info.has_lyrics === "true" && (
        <Suspense
          fallback={<div className="h-24 animate-pulse rounded-md bg-muted" />}
        >
          <SongLyrics id={song.id} />
        </Suspense>
      )}

      <Suspense
        fallback={
          <div className="flex flex-col gap-(--page-gap)">
            <div className="h-8 w-72 animate-pulse rounded-md bg-muted" />
            <SongListSkeleton length={5} />
          </div>
        }
      >
        <SongAlbumSongs token={token} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton length={1} />}>
        <SongRecommendations token={token} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton length={1} />}>
        <SongTrending token={token} trending={trending} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton length={1} />}>
        <SongSameArtists token={token} />
      </Suspense>
      {modules?.songsBysameActors && hasStarringArtist(song) && (
        <Suspense fallback={<SliderListSkeleton length={1} />}>
          <SongSameActors token={token} />
        </Suspense>
      )}

      <SliderList
        title={modules?.artists?.title ?? "Artists"}
        items={(song.more_info.artistMap?.artists ?? []).map((artist) => ({
          id: artist.id,
          name: artist.name,
          url: artist.perma_url,
          type: artist.type,
          image: artist.image,
        }))}
      />
    </div>
  );
}
