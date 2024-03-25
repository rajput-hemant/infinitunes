import { DetailsHeader } from "@/components/details-header";
import { SliderList } from "@/components/slider";
import { SongList } from "@/components/song/song-list";
import {
  getPlaylistDetails,
  getPlaylistRecommendations,
  getTrending,
} from "@/lib/jiosaavn-api";

type PlaylistPageProps = { params: { name: string; token: string } };

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
  const { playlist, recommendations, trending } = await fetcher(
    props.params.token
  );

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
