import { toCardItem } from "@infinitunes/types";

import { SliderList } from "~/components/slider/slider-list";
import { orFallback } from "~/lib/degrade";
import { api } from "~/lib/trpc/server";

type Playlist = Awaited<ReturnType<typeof api.playlist.details>>;
type TrendingPlaylists = Awaited<ReturnType<typeof api.get.trending>>;

type PlaylistRecommendationsProps = { playlist: Playlist };

export async function PlaylistRecommendations({
  playlist,
}: PlaylistRecommendationsProps) {
  const items = await orFallback(
    "playlist recommendations",
    api.playlist.recommendations({ id: playlist.id }),
    [],
  );
  return items.length ? (
    <SliderList
      title={
        playlist.modules?.relatedPlaylist?.title ?? "Recommended Playlists"
      }
      items={items.map(toCardItem)}
    />
  ) : null;
}

type PlaylistTrendingProps = {
  playlist: Playlist;
  trending: Promise<TrendingPlaylists>;
};

export async function PlaylistTrending({
  playlist,
  trending,
}: PlaylistTrendingProps) {
  const items = await trending;
  return items.length ? (
    <SliderList
      title={
        playlist.modules?.currentlyTrendingPlaylists?.title ??
        "Trending Playlists"
      }
      items={items.map(toCardItem)}
    />
  ) : null;
}
