import Link from "next/link";

import type { Album } from "@/types";

import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { MoreButton } from "./more-button";

type DetailsHeaderProps = {
  item: Album;
};

export function DetailsHeader({ item }: DetailsHeaderProps) {
  return (
    <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div className="relative aspect-square w-44 overflow-hidden rounded-md border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64">
        <ImageWithFallback
          src={getImageSrc(item.image, "high")}
          width={200}
          height={200}
          alt={item.name}
          fallback={`/images/placeholder/${item.type}.jpg`}
          className="size-full rounded-md object-cover"
        />

        <Skeleton className="absolute inset-0 -z-10" />
      </div>

      <div className="flex flex-col items-center justify-center font-medium lg:items-start lg:gap-2">
        <h1 className="flex items-center text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          {"explicit" in item && item.explicit && (
            <Badge className="mr-2 rounded px-1 py-0 font-bold">E</Badge>
          )}

          {item.name}
        </h1>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="hidden lg:block">
            <span>
              by{" "}
              {item.artist_map.artists.map(({ id, name, url }, i, arr) => (
                <Link
                  key={id}
                  href={getHref(url, "artist")}
                  title={name}
                  className="hover:text-foreground"
                >
                  {name}
                  {i !== arr.length - 1 && ","}
                </Link>
              ))}
            </span>
            {" · "}
            <span>{item.song_count} Songs</span>
            {" · "}
            <span>{item.play_count.toLocaleString()} Plays</span>
            {" · "}
            <span>{formatDuration(item.duration, "mm:ss")}</span>
          </p>

          <div className="text-center lg:hidden">
            <p>
              by{" "}
              {item.artist_map?.artists.map(({ id, name, url }, i) => (
                <Link
                  key={id}
                  href={getHref(url, "artist")}
                  title={name}
                  className="hover:text-foreground"
                >
                  {name}
                  {i !== item.artist_map?.artists.length - 1 && ","}
                </Link>
              ))}
            </p>

            <p className="capitalize">
              {item.type}
              {" · "}
              {item.play_count?.toLocaleString()} Plays
            </p>
          </div>

          <p className="hidden w-fit text-sm text-muted-foreground hover:text-foreground lg:block">
            <Link href={item.label_url}>{item.copyright_text}</Link>
          </p>
        </div>

        <div className="mt-4 flex gap-2 lg:mt-6">
          <PlayButton
            type={item.type}
            token={item.url.split("/").pop()!}
            className={cn(
              buttonVariants(),
              "rounded-full px-10 text-xl font-bold shadow-sm"
            )}
          >
            Play
          </PlayButton>

          <LikeButton
            className={cn(
              buttonVariants({ size: "icon", variant: "outline" }),
              "rounded-full shadow-sm"
            )}
          />

          <MoreButton
            name={item.name}
            subtitle={item.subtitle}
            type={item.type}
            image={item.image}
            songs={item.songs}
          />
        </div>
      </div>
    </div>
  );
}
