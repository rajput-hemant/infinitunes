import { toCardItem } from "@infinitunes/types";

import { SliderList } from "~/components/slider/slider-list";
import { orFallback } from "~/lib/degrade";
import { api } from "~/lib/trpc/server";

type Album = Awaited<ReturnType<typeof api.album.details>>;
type TrendingAlbums = Awaited<ReturnType<typeof api.get.trending>>;

type AlbumProps = { album: Album };

export async function AlbumRecommendations({ album }: AlbumProps) {
  const items = await orFallback(
    "album recommendations",
    api.album.recommendations({ id: album.id }),
    [],
  );
  return items.length ? (
    <SliderList
      title={album.modules?.reco?.title ?? "Recommended Albums"}
      items={items.map(toCardItem)}
    />
  ) : null;
}

type AlbumTrendingProps = {
  album: Album;
  trending: Promise<TrendingAlbums>;
};

export async function AlbumTrending({ album, trending }: AlbumTrendingProps) {
  const items = await trending;
  return items.length ? (
    <SliderList
      title={album.modules?.currentlyTrending?.title ?? "Trending"}
      items={items.map(toCardItem)}
    />
  ) : null;
}

export async function AlbumSameYear({ album }: AlbumProps) {
  const items = await orFallback(
    "albums from the same year",
    api.album.sameYear({ year: `${album.year}` }),
    [],
  );
  return items.length ? (
    <SliderList
      title={
        album.modules?.topAlbumsFromSameYear?.title ?? "Albums From Same Year"
      }
      items={items.map(toCardItem)}
    />
  ) : null;
}
