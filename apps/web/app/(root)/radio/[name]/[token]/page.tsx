import type { SongSearch } from "@infinitunes/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayButton } from "~/components/play-button";
import { SongList } from "~/components/song-list";
import { siteConfig } from "~/config/site";
import { getFeaturedRadioStations, search } from "~/lib/jiosaavn-api";
import { getHref, getImageSrc } from "~/lib/utils";

type Props = {
  params: Promise<{ name: string; token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, token } = await params;

  const stations = await getFeaturedRadioStations(1, 50);
  const station = stations.find((s) => s.perma_url.endsWith(token));

  if (!station) {
    return { title: "Unknown Station" };
  }

  return {
    title: station.title,
    description: station.subtitle,
    openGraph: {
      title: station.title,
      description: station.subtitle,
      url: getHref(station.perma_url, station.type),
      images: {
        url: `/api/og?title=${station.title}&description=${station.subtitle}&image=${getImageSrc(station.image, "high")}&square=true`,
        alt: station.title,
      },
    },
  };
}

export default async function RadioStationPage({ params }: Props) {
  const { token } = await params;

  const [stations, songsResult] = await Promise.all([
    getFeaturedRadioStations(1, 50),
    search(token, "song", 1, 50),
  ]);

  const songs = songsResult as SongSearch;

  const station = stations.find((s) => s.perma_url.endsWith(token));

  if (!station) return notFound();

  return (
    <div className="space-y-4">
      <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-full border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64">
          <img
            src={getImageSrc(station.image, "high")}
            alt={station.title}
            className="size-full rounded-full object-cover"
          />
        </div>

        <figcaption className="flex w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
          <h1 className="flex items-center truncate text-center font-heading text-xl capitalize drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:text-start">
            {station.title}
          </h1>

          {station.subtitle && (
            <p className="text-sm text-muted-foreground">{station.subtitle}</p>
          )}

          <div className="mt-4 flex gap-2 lg:mt-6">
            <PlayButton
              type="radio_station"
              token={token}
              className="rounded-full px-10 text-xl font-bold shadow-xs"
            >
              Play
            </PlayButton>
          </div>
        </figcaption>
      </figure>

      {songs.results.length > 0 && (
        <SongList items={songs.results} showAlbum={false} />
      )}
    </div>
  );
}
