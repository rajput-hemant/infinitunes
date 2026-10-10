import { toCardItem } from "@infinitunes/types";

import { SliderList } from "~/components/slider/slider-list";
import { api } from "~/lib/trpc/server";

type Playlist = Awaited<ReturnType<typeof api.playlist.details>>;

export async function PlaylistRecommendations({
  playlist,
}: {
  playlist: Playlist;
}) {
  const [result] = await Promise.allSettled([
    api.playlist.recommendations({ id: playlist.id }),
  ]);
  const items = result.status === "fulfilled" ? result.value : [];
  return items.length ? (
    <SliderList
      title={
        playlist.modules?.relatedPlaylist?.title ?? "Recommended Playlists"
      }
      items={items.map(toCardItem)}
    />
  ) : null;
}

export async function PlaylistTrending({ playlist }: { playlist: Playlist }) {
  const [result] = await Promise.allSettled([
    api.get.trending({ type: "playlist" }),
  ]);
  const items = result.status === "fulfilled" ? result.value : [];
  return (
    <SliderList
      title={
        playlist.modules?.currentlyTrendingPlaylists?.title ??
        "Trending Playlists"
      }
      items={items.map(toCardItem)}
    />
  );
}
