import { toCardItem } from "@infinitunes/types";

import { SliderList } from "~/components/slider/slider-list";
import { api } from "~/lib/trpc/server";

type Album = Awaited<ReturnType<typeof api.album.details>>;
type TrendingAlbums = Awaited<ReturnType<typeof api.get.trending>>;

export async function AlbumRecommendations({ album }: { album: Album }) {
  const [result] = await Promise.allSettled([
    api.album.recommendations({ id: album.id }),
  ]);
  const items = result.status === "fulfilled" ? result.value : [];
  return items.length ? (
    <SliderList
      title={album.modules?.reco?.title ?? "Recommended Albums"}
      items={items.map(toCardItem)}
    />
  ) : null;
}

export async function AlbumTrending({
  album,
  trending,
}: {
  album: Album;
  trending: Promise<TrendingAlbums>;
}) {
  const items = await trending;
  return items.length ? (
    <SliderList
      title={album.modules?.currentlyTrending?.title ?? "Trending"}
      items={items.map(toCardItem)}
    />
  ) : null;
}

export async function AlbumSameYear({ album }: { album: Album }) {
  const [result] = await Promise.allSettled([
    api.album.sameYear({ year: `${album.year}` }),
  ]);
  const items = result.status === "fulfilled" ? result.value : [];
  return items.length ? (
    <SliderList
      title={
        album.modules?.topAlbumsFromSameYear?.title ?? "Albums From Same Year"
      }
      items={items.map(toCardItem)}
    />
  ) : null;
}
