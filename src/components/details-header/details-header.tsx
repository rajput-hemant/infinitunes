import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import type {
  Album,
  Artist,
  Episode,
  Label,
  Mix,
  Playlist,
  ShowDetails,
  Song,
} from "@/types";

import { getUser } from "@/lib/auth";
import { getUserFavorites, getUserPlaylists } from "@/lib/db/queries";
import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { DownloadButton } from "../download-button";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { MoreButton } from "./more-button";

type DetailsHeaderProps = {
  item: Album | Song | Playlist | Artist | Episode | ShowDetails | Label | Mix;
};

export async function DetailsHeader({ item }: DetailsHeaderProps) {
  const songs =
    item.type === "song" ? [item]
    : "songs" in item ? item.songs
    : [];

  const user = await getUser();

  let playlists, favorites;

  if (user) {
    [playlists, favorites] = await Promise.all([
      getUserPlaylists(user.id),
      getUserFavorites(user.id),
    ]);
  }

  return (
    <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 shrink-0 overflow-hidden rounded-md border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64",
          (item.type === "artist" || item.type === "label") && "rounded-full"
        )}
      >
        <ImageWithFallback
          src={getImageSrc(item.image, "high")}
          width={200}
          height={200}
          alt={item.name}
          fallback={`/images/placeholder/${item.type}.jpg`}
          className={cn(
            "size-full rounded-md object-cover",
            (item.type === "artist" || item.type === "label") && "scale-105"
          )}
        />

        <Skeleton
          className={cn(
            "absolute inset-0 -z-10",
            (item.type === "artist" || item.type === "label") && "rounded-full"
          )}
        />
      </div>

      <figcaption className="flex w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
        <h1
          title={item.name}
          className="flex items-center truncate text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:text-start"
        >
          {"explicit" in item && item.explicit && (
            <Badge className="mr-2 rounded px-1 py-0 font-bold">E</Badge>
          )}
          {item.name}

          {"is_verified" in item && item.is_verified && (
            <BadgeCheck
              fill="#3b82f6"
              className="ml-2 inline-block text-background"
            />
          )}
        </h1>

        <div className="space-y-2 text-sm text-muted-foreground">
          {(item.type === "song" || item.type === "episode") && (
            <>
              {item.type === "song" && (
                <p>
                  <Link
                    href={getHref(item.album_url, "album")}
                    className="hover:text-foreground"
                  >
                    {item.album}
                  </Link>
                  {" by "}
                  {item.artist_map.primary_artists.map(
                    ({ id, name, url }, i, arr) => (
                      <Link
                        key={id}
                        href={getHref(url, "artist")}
                        className="hover:text-foreground"
                      >
                        {name}
                        {i !== arr.length - 1 && ", "}
                      </Link>
                    )
                  )}
                </p>
              )}

              {item.type === "episode" && <p>{item.header_desc}</p>}

              <p className="capitalize">
                {item.type}
                {" · "}
                {item.play_count.toLocaleString()} Plays{" · "}
                {formatDuration(item.duration, "mm:ss")}
                {" · "}
                {item.language}
              </p>
            </>
          )}

          {item.type === "album" && (
            <>
              <p className="hidden lg:block">
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
                {" · "}
                {item.song_count} Songs
                {" · "}
                {item.play_count.toLocaleString()} Plays
                {" · "}
                {formatDuration(item.duration, "mm:ss")}
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
            </>
          )}

          {(item.type === "song" || item.type === "album") && (
            <p className="hidden w-fit text-sm text-muted-foreground hover:text-foreground lg:block">
              <Link href={item.label_url ?? "#"}>{item.copyright_text}</Link>
            </p>
          )}

          {item.type === "playlist" && (
            <p className="capitalize">
              {item.subtitle}
              {" · "}
              {item.subtitle_desc
                .reverse()
                .map((s, i, arr) => s + (i !== arr.length - 1 ? " · " : ""))}
            </p>
          )}

          {item.type === "show" && (
            <p>
              Podcast{" · "}
              {item.fan_count.toLocaleString()} Fans
            </p>
          )}

          {item.type === "artist" && (
            <p>
              Artist
              {" · "}
              {item.fan_count.toLocaleString()} Listeners
            </p>
          )}

          {item.type === "mix" && (
            <p>
              {item.firstname}
              {" · "}
              {item.lastname}
              {" · "}
              {item.list_count} Songs
            </p>
          )}

          {item.type === "label" && <p>Record Label</p>}
        </div>

        {item.type !== "label" && (
          <div className="mt-4 flex gap-2 lg:mt-6">
            <PlayButton
              type={item.type}
              token={
                item.type === "show" ?
                  item.id
                : (item.type === "artist" ? item.urls.songs : item.url)
                    .split("/")
                    .pop()!
              }
              className={cn(
                buttonVariants(),
                "rounded-full px-10 text-xl font-bold shadow-sm"
              )}
            >
              Play
            </PlayButton>

            <LikeButton
              user={user}
              type={item.type}
              token={item.id}
              name={item.name}
              favourites={favorites}
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "rounded-full shadow-sm"
              )}
            />

            <DownloadButton
              songs={songs ?? []}
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "rounded-full shadow-sm"
              )}
            />

            <MoreButton
              user={user}
              name={item.name}
              subtitle={item.subtitle}
              type={item.type}
              image={item.image}
              songs={songs ?? []}
              playlists={playlists}
            />
          </div>
        )}
      </figcaption>
    </figure>
  );
}
