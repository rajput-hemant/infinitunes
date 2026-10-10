import { decode, getImageSrc } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache, Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SliderListSkeleton } from "~/components/skeletons/slider-list-skeleton";
import { SliderList } from "~/components/slider/slider-list";
import { SongList } from "~/components/song-list/song-list";
import { orFallback } from "~/lib/degrade";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

import {
  AlbumRecommendations,
  AlbumSameYear,
  AlbumTrending,
} from "./_components/secondary-lists";

const getAlbum = cache(async (token: string) =>
  orNotFound(api.album.details({ token })),
);

type AlbumDetailsPageProps = {
  params: Promise<{ name: string; token: string }>;
};

export async function generateMetadata({
  params,
}: AlbumDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const album = await getAlbum(token);

  return pageMetadata({
    title: album.title,
    description: album.subtitle,
    url: `/album/${name}/${token}`,
    image: getImageSrc(album.image, "high"),
    square: true,
  });
}

export default async function AlbumDetailsPage(props: AlbumDetailsPageProps) {
  const { token } = await props.params;
  // Trending does not depend on the album; start it before the album resolves.
  // orFallback never rejects, so an early notFound() leaves nothing unhandled.
  const trending = orFallback(
    "trending",
    api.get.trending({ type: "album" }),
    [],
  );
  const album = await getAlbum(token);

  const songs = Array.isArray(album.list) ? album.list : [];

  return (
    <div className="space-y-4">
      <DetailsHeader item={album} />

      <SongList items={songs} showAlbum={false} />

      <Suspense fallback={<SliderListSkeleton length={1} />}>
        <AlbumRecommendations album={album} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton length={1} />}>
        <AlbumTrending album={album} trending={trending} />
      </Suspense>
      <Suspense fallback={<SliderListSkeleton length={1} />}>
        <AlbumSameYear album={album} />
      </Suspense>

      <SliderList
        title={album.modules?.artists.title ?? "Artists"}
        items={(album.more_info.artistMap?.artists ?? []).map((artist) => ({
          id: artist.id,
          name: decode(artist.name),
          url: artist.perma_url,
          type: artist.type,
          image: artist.image,
        }))}
      />
    </div>
  );
}
