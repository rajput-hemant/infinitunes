import { getImageSrc } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Radio } from "lucide-react";
import type { Metadata } from "next";
import { cache } from "react";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { LibraryEmpty } from "~/components/library/library-section";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { PlayButton } from "~/components/play-button";
import { SongList } from "~/components/song-list/song-list";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";
import { cn, getHref } from "~/lib/utils";

type RadioStationPageProps = {
  params: Promise<{ name: string; token: string }>;
};

const getStation = cache(async (name: string, token: string) =>
  orNotFound(api.radio.stationDetails({ name, token })),
);

export async function generateMetadata({
  params,
}: RadioStationPageProps): Promise<Metadata> {
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

export default async function RadioStationPage({
  params,
}: RadioStationPageProps) {
  const { name, token } = await params;

  const { station, songs } = await getStation(name, token);

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <figure className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-full shadow-md md:w-56 xl:w-64">
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
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Radio station
          </p>
          <h1 className="max-w-full truncate text-center font-heading text-2xl capitalize text-foreground sm:text-3xl md:text-4xl lg:text-start">
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
        <section className="flex flex-col gap-4">
          <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
            Coming up
          </h2>
          <SongList items={songs} showAlbum={false} />
        </section>
      ) : (
        <LibraryEmpty
          icon={Radio}
          title="Ready to tune in"
          titleAs="p"
          description="Click Play to tune into this radio station."
        />
      )}
    </div>
  );
}
