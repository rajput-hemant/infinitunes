import { decode, getImageSrc } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache, Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SliderListSkeleton } from "~/components/skeletons/slider-list-skeleton";
import { SliderList } from "~/components/slider/slider-list";
import { SongList } from "~/components/song-list/song-list";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

import {
  PlaylistRecommendations,
  PlaylistTrending,
} from "./_components/secondary-lists";

const getPlaylist = cache(async (token: string) =>
  orNotFound(api.playlist.details({ token })),
);

type PlaylistPageProps = { params: Promise<{ name: string; token: string }> };

export async function generateMetadata({
  params,
}: PlaylistPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const playlist = await getPlaylist(token);

  return pageMetadata({
    title: playlist.title,
    description: playlist.subtitle,
    url: `/playlist/${name}/${token}`,
    image: getImageSrc(playlist.image, "high"),
    square: true,
  });
}
export default async function PlaylistDetailsPage(props: PlaylistPageProps) {
  const { token } = await props.params;
  const playlist = await getPlaylist(token);

  const songs = Array.isArray(playlist.list) ? playlist.list : [];
  const artists = playlist.more_info.artists ?? [];

  return (
    <div className="space-y-4">
      <DetailsHeader item={playlist} />

      <SongList items={songs} />

      <Suspense fallback={<SliderListSkeleton />}>
        <PlaylistRecommendations playlist={playlist} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton />}>
        <PlaylistTrending playlist={playlist} />
      </Suspense>

      {artists.length > 0 && (
        <SliderList
          title={playlist.modules?.artists?.title ?? "Artists"}
          items={artists.map((artist) => ({
            id: artist.id,
            name: decode(artist.name),
            url: artist.perma_url,
            type: artist.type,
            image: artist.image,
          }))}
        />
      )}
    </div>
  );
}
