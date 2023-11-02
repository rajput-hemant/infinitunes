import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import {
  Album,
  Artist,
  Episode,
  Label,
  Mix,
  Playlist,
  ShowDetails,
  Song,
} from "@/types";
import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { DetailsHeaderMoreButton } from "./details-header-more-button";
import { LikeButton } from "./like-button";
import { Badge } from "./ui/badge";
import { Button, buttonVariants } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { H2 } from "./ui/topography";

type Props = {
  item: Song | Album | Playlist | Artist | Episode | ShowDetails | Label | Mix;
};

export const DetailsHeader = ({ item }: Props) => {
  return (
    <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 overflow-hidden rounded-md border p-1 shadow-2xl transition-[width] duration-1000 dark:shadow-black md:w-56 xl:w-64",
          (item.type === "artist" || item.type === "label") && "rounded-full"
        )}
      >
        <Image
          src={getImageSrc(item.image, "high")}
          width={200}
          height={200}
          alt={item.name}
          className={cn(
            "h-full w-full rounded-md object-cover",
            item.type === "artist" && "scale-105"
          )}
        />

        <Skeleton className="absolute inset-0 -z-10" />
      </div>

      <div className="flex flex-col items-center justify-center font-medium lg:items-start lg:gap-2">
        <H2 className="line-clamp-3 flex items-center">
          {"explicit" in item && item.explicit && (
            <Badge className="mr-2 rounded-[2px] px-1 py-0 font-bold">E</Badge>
          )}

          {item.name}

          {"is_verified" in item && item.is_verified && (
            <BadgeCheck
              fill="#3b82f6"
              className="text-background ml-2 inline-block"
            />
          )}
        </H2>

        <div className="text-muted-foreground space-y-1.5 text-sm">
          {(item.type === "song" || item.type === "episode") && (
            <>
              <p>
                {item.type === "song" ? (
                  <>
                    <span>
                      <Link
                        href={getHref(item.album_url, "album")}
                        className="hover:text-foreground"
                      >
                        {item.album}
                      </Link>
                    </span>
                    <span> by </span>
                    <span>
                      {item.artist_map.primary_artists.map(
                        ({ id, name, url }, i) => (
                          <Link
                            key={id}
                            href={getHref(url, "artist")}
                            className="hover:text-foreground"
                          >
                            {name}
                            {i !== item.artist_map.primary_artists.length - 1 &&
                              ", "}
                          </Link>
                        )
                      )}
                    </span>
                  </>
                ) : (
                  <span>{item.header_desc}</span>
                )}
              </p>

              <p>
                <span className="capitalize">{item.type}</span>
                {" · "}
                <span>{item.play_count.toLocaleString()} Plays</span>
                {" · "}
                <span>{formatDuration(item.duration, "mm:ss")}</span>
                {" · "}
                <span className="capitalize">{item.language}</span>
              </p>
            </>
          )}

          {item.type === "album" && (
            <>
              <p className="hidden lg:block">
                <span>
                  by{" "}
                  {item.artist_map.artists.map(({ id, name, url }, i) => (
                    <Link
                      key={id}
                      href={getHref(url, "artist")}
                      title={name}
                      className="hover:text-foreground"
                    >
                      {name}
                      {i !== item.artist_map.artists.length - 1 && ","}
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

              <p className="text-center lg:hidden">
                <span>
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
                </span>

                <span className="block">
                  <span className="capitalize">{item.type}</span>
                  {" · "}
                  <span>{item.play_count?.toLocaleString()} Plays</span>{" "}
                </span>
              </p>
            </>
          )}

          {item.type === "playlist" && (
            <p>
              <span className="capitalize">{item.subtitle}</span>
              {" · "}
              <span>
                {item.subtitle_desc
                  .reverse()
                  .map(
                    (s, i) =>
                      s + (i !== item.subtitle_desc.length - 1 ? " · " : "")
                  )}
              </span>
            </p>
          )}

          {item.type === "show" && (
            <p>
              <span>Podcast</span>
              {" · "}
              <span>{item.fan_count.toLocaleString()} Fans</span>
            </p>
          )}

          {item.type === "artist" && (
            <p>
              <span>Artist</span>
              {" · "}
              <span>{item.fan_count.toLocaleString()} Listeners</span>
            </p>
          )}

          {item.type === "mix" && (
            <p>
              <span>{item.firstname}</span>
              {" · "}
              <span>{item.lastname}</span>
              {" · "}
              <span>{item.list_count} Songs</span>
            </p>
          )}

          {(item.type === "song" || item.type === "album") && (
            <p className="text-muted-foreground hover:text-foreground hidden w-fit text-sm lg:block">
              <Link href={item.label_url ?? "#"}>{item.copyright_text}</Link>
            </p>
          )}

          {item.type === "label" && <p>Record Label</p>}
        </div>

        {item.type !== "label" && (
          <div className="mt-3 flex gap-2 lg:mt-6">
            <Button className="rounded-full px-10 text-xl font-bold">
              Play
            </Button>

            <LikeButton
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "rounded-full p-1.5"
              )}
            />

            <DetailsHeaderMoreButton
              name={item.name}
              subtitle={item.subtitle}
              type={item.type}
              image={item.image}
            />
          </div>
        )}
      </div>
    </div>
  );
};
