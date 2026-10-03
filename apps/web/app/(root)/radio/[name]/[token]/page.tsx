import { getImageSrc } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import type { Metadata } from "next";
import { cache } from "react";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { PlayButton } from "~/components/play-button";
import { SongList } from "~/components/song-list/song-list";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";
import { cn, getHref } from "~/lib/utils";

type Props = {
  params: Promise<{ name: string; token: string }>;
};

const getStation = cache(async (name: string, token: string) =>
  orNotFound(api.radio.stationDetails({ name, token })),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, token } = await params;

  const { station } = await getStation(name, token);

  return pageMetadata({
    title: station.title,
    description: station.subtitle,
    url: getHref(station.perma_url, "radio"),
    image: getImageSrc(station.image, "high"),
    square: true,
  });
}

export default async function RadioStationPage({ params }: Props) {
  const { name, token } = await params;

  const { station, songs } = await getStation(name, token);

  return (
    <div className="space-y-4">
      <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-full border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64">
          <ImageWithFallback
            src={getImageSrc(station.image, "high")}
            width={200}
            height={200}
            alt={station.title}
            fallback={getPlaceholderSrc("radio_station")}
            className="size-full rounded-full object-cover"
          />
        </div>

        <figcaption className="flex w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
          <h1 className="max-w-full truncate text-center font-heading text-xl capitalize drop-shadow-md text-foreground sm:text-2xl md:text-3xl lg:text-start">
            {station.title}
          </h1>

          {station.subtitle && (
            <p className="text-sm text-muted-foreground">{station.subtitle}</p>
          )}

          <div className="mt-4 flex gap-2 lg:mt-6">
            <PlayButton
              type="radio_station"
              token={token}
              className={cn(
                buttonVariants(),
                "rounded-full px-10 text-xl font-bold shadow-xs",
              )}
            >
              Play
            </PlayButton>
          </div>
        </figcaption>
      </figure>

      {songs.length > 0 ? (
        <SongList items={songs} showAlbum={false} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>Click Play to tune into this radio station.</p>
        </div>
      )}
    </div>
  );
}
