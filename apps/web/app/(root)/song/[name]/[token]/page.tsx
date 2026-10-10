import { getImageSrc, parseToken, toCardItem } from "@infinitunes/types";
import { Separator } from "@infinitunes/ui/components/separator";
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

const getSong = cache(async (token: string) => {
  const data = await orNotFound(api.song.details({ token }));
  const song = data.songs[0];
  if (song?.type !== "song") notFound();
  return { song, modules: data.modules };
});

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
async function SongLyrics({ token }: { token: string }) {
  const { song } = await getSong(token);
  if (song.more_info.has_lyrics !== "true") return null;
  const lyrics = await orFallback(
    "lyrics",
    api.get.lyrics({ id: song.id }),
    undefined,
  );
  return lyrics ? <Lyrics lyrics={lyrics} /> : null;
}

async function SongAlbumSongs({ token }: { token: string }) {
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
    <>
      <h2 className="pl-2 font-heading text-2xl dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl lg:pl-0">
        More from {song.more_info.album}
      </h2>
      <Separator />
      <SongList items={songs} />
    </>
  ) : null;
}

async function SongRecommendations({ token }: { token: string }) {
  const [{ modules }, items] = await Promise.all([
    getSong(token),
    getSong(token).then(({ song: currentSong }) =>
      orFallback(
        "recommendations",
        api.song.recommendations({ id: currentSong.id }),
        [],
      ),
    ),
  ]);
  return items.length ? (
    <SliderList title={modules!.reco.title} items={items.map(toCardItem)} />
  ) : null;
}

async function SongTrending({ token }: { token: string }) {
  const [{ modules }, items] = await Promise.all([
    getSong(token),
    orFallback("trending", api.get.trending({ type: "song" }), []),
  ]);
  return items.length ? (
    <SliderList
      title={modules!.currentlyTrending.title}
      items={items.map(toCardItem)}
    />
  ) : null;
}

async function SongSameArtists({ token }: { token: string }) {
  const { modules } = await getSong(token);
  const params = modules!.songsBysameArtists.source_params;
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
    <SliderList
      title={modules!.songsBysameArtists.title}
      items={items.map(toCardItem)}
    />
  ) : null;
}

async function SongSameActors({ token }: { token: string }) {
  const { song, modules } = await getSong(token);
  if (
    !song.more_info.artistMap?.artists?.some(
      (artist) => artist.role === "starring",
    )
  )
    return null;
  const params = modules!.songsBysameActors.source_params;
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
    <SliderList
      title={modules!.songsBysameActors.title}
      items={items.map(toCardItem)}
    />
  ) : null;
}

export default async function SongDetailsPage(props: SongDetailsPageProps) {
  const { token } = await props.params;

  const { song, modules } = await getSong(token);

  return (
    <div className="space-y-4">
      <DetailsHeader item={song} />

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-8 w-72 animate-pulse rounded bg-muted" />
            <SongListSkeleton length={5} />
          </div>
        }
      >
        <SongAlbumSongs token={token} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton />}>
        <SongRecommendations token={token} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton />}>
        <SongTrending token={token} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton />}>
        <SongSameArtists token={token} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton />}>
        <SongSameActors token={token} />
      </Suspense>
      <Suspense
        fallback={<div className="h-24 animate-pulse rounded bg-muted" />}
      >
        <SongLyrics token={token} />
      </Suspense>

      <SliderList
        title={modules!.artists.title}
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
