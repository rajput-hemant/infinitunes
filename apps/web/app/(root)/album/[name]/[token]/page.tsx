import type { Metadata } from "next";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SliderList } from "~/components/slider/slider-list";
import { SongList } from "~/components/song-list/song-list";
import { api } from "~/lib/trpc/server";
import { decode, getImageSrc, ogImageUrl, toCardItem } from "~/lib/utils";

const getAlbum = cache(async (token: string) => api.album.details({ token }));

type AlbumDetailsPageProps = {
  params: Promise<{ name: string; token: string }>;
};

export async function generateMetadata({
  params,
}: AlbumDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const album = await getAlbum(token);

  return {
    title: album.title,
    description: album.subtitle,
    openGraph: {
      title: album.title,
      description: album.subtitle,
      url: `/album/${name}/${token}`,
      images: {
        url: ogImageUrl({
          title: album.title,
          description: album.subtitle,
          image: getImageSrc(album.image, "high"),
          square: true,
        }),
        alt: album.title,
      },
    },
  };
}

async function fetcher(token: string) {
  const trendingPromise = api.get.trending({ type: "album" });
  // settled later; keep it from being an unhandled rejection during the await below
  trendingPromise.catch(() => null);

  const album = await getAlbum(token);

  const [recommendations, trending, sameYear] = await Promise.allSettled([
    api.album.recommendations({ id: album.id }),
    trendingPromise,
    api.album.sameYear({ year: `${album.year}` }),
  ]);

  return {
    album,
    recommendations:
      recommendations.status === "fulfilled" ? recommendations.value : [],
    trending: trending.status === "fulfilled" ? trending.value : [],
    sameYear: sameYear.status === "fulfilled" ? sameYear.value : [],
  };
}

export default async function AlbumDetailsPage(props: AlbumDetailsPageProps) {
  const { token } = await props.params;

  const { album, recommendations, trending, sameYear } = await fetcher(token);

  const songs = Array.isArray(album.list) ? album.list : [];

  return (
    <div className="space-y-4">
      <DetailsHeader item={album} />

      <SongList items={songs} showAlbum={false} />

      {recommendations.length > 0 && (
        <SliderList
          title={album.modules?.reco?.title ?? "Recommended Albums"}
          items={recommendations.map(toCardItem)}
        />
      )}

      {trending.length > 0 && (
        <SliderList
          title={album.modules?.currentlyTrending?.title ?? "Trending"}
          items={trending.map(toCardItem)}
        />
      )}

      {sameYear.length > 0 && (
        <SliderList
          title={
            album.modules?.topAlbumsFromSameYear?.title ??
            "Albums From Same Year"
          }
          items={sameYear.map(toCardItem)}
        />
      )}

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
