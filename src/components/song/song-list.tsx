import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { Episode, Song } from "@/types";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { TileMoreButton } from "./tile-more-button";
import { TilePlayPauseButton } from "./tile-play-pause-button";

type Props = {
  items: (Song | Episode)[];
  showAlbum?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const SongList = ({
  items,
  showAlbum = true,
  className,
  ...props
}: Props) => {
  return (
    <div
      className={cn("text-muted-foreground space-y-2", className)}
      {...props}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          className="hover:bg-accent group flex h-14 w-full cursor-pointer items-center justify-between rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-sm"
        >
          {/* song index */}
          <div className="hidden w-[6%] justify-center lg:flex xl:w-[4%]">
            <span
              className={cn(
                "truncate font-medium",
                !showAlbum && "group-hover:hidden"
              )}
            >
              {i + 1}
            </span>

            {!showAlbum && (
              <PlayButton
                type={item.type}
                token={item.url.split("/").pop()!}
                className="hover:text-primary border-muted-foreground group/play hover:border-primary hidden aspect-square h-8 items-center justify-center rounded-full border duration-300 hover:h-9 group-hover:flex"
              >
                <Play
                  strokeWidth={10}
                  className="h-full w-5 p-1 duration-300 group-hover/play:w-6"
                />
              </PlayButton>
            )}
          </div>

          {/* song name, image & album OR episode name & duration */}
          <div className="flex w-[82%] items-center justify-between gap-4 xl:w-[88%]">
            {showAlbum && (
              <div className="relative aspect-square h-10 min-w-fit overflow-hidden rounded">
                <Image
                  src={getImageSrc(item.image, "low")}
                  alt={item.name}
                  fill
                  className="z-10 object-cover duration-300 group-hover:brightness-50"
                />

                <Skeleton className="absolute inset-0 rounded" />

                <TilePlayPauseButton
                  id={item.id}
                  type={item.type}
                  token={item.url.split("/").pop()!}
                />
              </div>
            )}

            <div
              className={cn(
                "flex w-[calc(100%-2.5rem)] flex-col lg:flex-row xl:w-2/3"
              )}
            >
              <h3 className="w-full truncate font-semibold">
                <Link
                  href={getHref(
                    item.url,
                    item.type === "song" ? "song" : "episode"
                  )}
                  className="group-hover:text-primary"
                >
                  {item.name}
                </Link>
              </h3>

              <ScrollArea className="w-full truncate pb-1">
                {item.artist_map.primary_artists.map((artist, i) => (
                  <Link
                    key={artist.id}
                    href={getHref(artist.url, "artist")}
                    className="hover:text-foreground"
                  >
                    {artist.name}
                    {i !== item.artist_map.primary_artists.length - 1 && ", "}
                  </Link>
                ))}

                <ScrollBar
                  orientation="horizontal"
                  className="mt-1 h-1 w-full"
                />
              </ScrollArea>
            </div>

            {showAlbum && item.type !== "episode" && (
              <p className="hidden w-1/3 truncate xl:block">
                <Link
                  href={getHref(item.album_url, "album")}
                  className="hover:text-primary"
                >
                  {item.album}
                </Link>
              </p>
            )}

            {item.type === "episode" && (
              <p className="hidden w-full pr-8 text-end lg:block">
                {new Date(item.release_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          {/* controls */}
          <div className="flex w-[12%] items-center justify-end lg:justify-between xl:w-[8%]">
            <LikeButton className="hover:text-primary hidden size-5 lg:block" />

            <span className="mx-auto hidden truncate lg:block">
              {formatDuration(item.duration, "mm:ss")}
            </span>

            <TileMoreButton item={item} showAlbum={showAlbum} />
          </div>
        </div>
      ))}
    </div>
  );
};
