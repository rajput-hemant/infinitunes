import type { Playlist, Trending } from "@infinitunes/types";
import type { Metadata } from "next";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SliderList } from "~/components/slider/slider-list";
import { SongList } from "~/components/song-list/song-list";
import { api } from "~/lib/trpc/server";
import { decode, getImageSrc, ogImageUrl, toCardItem } from "~/lib/utils";

type PlaylistPageProps = { params: Promise<{ name: string; token: string }> };

export async function generateMetadata({
  params,
}: PlaylistPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const playlist = (await api.playlist.details({
    token,
  })) as unknown as Playlist;

  return {
    title: playlist.title,
    description: playlist.subtitle,
    openGraph: {
      title: playlist.title,
      description: playlist.subtitle,
      url: `/playlist/${name}/${token}`,
      images: {
        url: ogImageUrl({
          title: playlist.title,
          description: playlist.subtitle,
          image: getImageSrc(playlist.image, "high"),
          square: true,
        }),
        alt: playlist.title,
      },
    },
  };
}
async function fetcher(token: string) {
  const playlist = (await api.playlist.details({
    token,
  })) as unknown as Playlist;

  const [recommendations, trending] = await Promise.allSettled([
    api.playlist.recommendations({
      id: playlist.id,
    }) as unknown as Promise<Playlist[]>,
    api.get.trending({ type: "playlist" }) as unknown as Promise<Trending>,
  ]);

  return {
    playlist,
    recommendations:
      recommendations.status === "fulfilled" ? recommendations.value : [],
    trending: trending.status === "fulfilled" ? trending.value : [],
  };
}

export default async function PlaylistDetailsPage(props: PlaylistPageProps) {
  const { token } = await props.params;

  const { playlist, recommendations, trending } = await fetcher(token);

  const songs = Array.isArray(playlist.list) ? playlist.list : [];
  const artists = playlist.more_info.artists ?? [];

  return (
    <div className="space-y-4">
      <DetailsHeader item={playlist} />

      <SongList items={songs} />

      {recommendations.length > 0 && (
        <SliderList
          title={
            playlist.modules?.relatedPlaylist?.title ?? "Recommended Playlists"
          }
          items={recommendations.map(toCardItem)}
        />
      )}

      <SliderList
        title={
          playlist.modules?.currentlyTrendingPlaylists?.title ??
          "Trending Playlists"
        }
        items={trending.map(toCardItem)}
      />

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
