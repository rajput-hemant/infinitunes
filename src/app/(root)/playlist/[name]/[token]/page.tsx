import type { Metadata } from "next";

import { DetailsHeader } from "@/components/details-header";
import { SliderList } from "@/components/slider";
import { SongList } from "@/components/song-list";
import {
  getPlaylistDetails,
  getPlaylistRecommendations,
  getTrending,
} from "@/lib/jiosaavn-api";
import { getImageSrc } from "@/lib/utils";

type PlaylistPageProps = { params: Promise<{ name: string; token: string }> };

export async function generateMetadata({
  params,
}: PlaylistPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const playlist = await getPlaylistDetails(token);

  return {
    title: playlist.name,
    description: playlist.subtitle,
    openGraph: {
      title: playlist.name,
      description: playlist.subtitle,
      url: `/playlist/${name}/${token}`,
      images: {
        url: `/api/og?title=${playlist.name}&description=${playlist.subtitle}&image=${getImageSrc(playlist.image, "high")}&square=true`,
        alt: playlist.name,
      },
    },
  };
}
async function fetcher(token: string) {
  const playlist = await getPlaylistDetails(token);

  const [recommendations, trending] = await Promise.all([
    getPlaylistRecommendations(playlist.id),
    getTrending("playlist"),
  ]);

  return {
    playlist,
    recommendations,
    trending,
  };
}

export default async function PlaylistDetailsPage(props: PlaylistPageProps) {
  const { token } = await props.params;

  const { playlist, recommendations, trending } = await fetcher(token);

  return (
    <div className="space-y-4">
      <DetailsHeader item={playlist} />

      <SongList items={playlist.songs!} />

      {recommendations.length > 0 && (
        <SliderList
          title={
            playlist.modules?.related_playlist.title ?? "Recommended Playlists"
          }
          items={recommendations}
        />
      )}

      <SliderList
        title={
          playlist.modules?.currently_trending_playlists.title ??
          "Trending Playlists"
        }
        items={trending}
      />

      {playlist.artists && playlist.artists.length > 0 && (
        <SliderList
          title={playlist.modules?.artists.title ?? "Artists"}
          items={playlist.artists}
        />
      )}
    </div>
  );
}
