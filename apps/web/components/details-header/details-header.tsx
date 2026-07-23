import type {
  Album,
  Artist,
  Episode,
  Label,
  Mix,
  Playlist,
  ShowDetails,
  Song,
} from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { cn, decode, formatDuration, getHref, getImageSrc } from "~/lib/utils";

import { DownloadButton } from "../download-button";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { MoreButton } from "./more-button";

type DetailsItem =
  | Album
  | Song
  | Playlist
  | Artist
  | Episode
  | ShowDetails
  | Label
  | Mix;

function getId(item: DetailsItem): string {
  return (item as { id: string }).id;
}

function getVerified(item: DetailsItem): boolean {
  return "is_verified" in item
    ? Boolean((item as { is_verified: unknown }).is_verified)
    : false;
}

function getExplicit(item: DetailsItem): boolean {
  return "explicit" in item
    ? Boolean((item as { explicit: unknown }).explicit)
    : false;
}

type DetailsHeaderProps = {
  item: DetailsItem;
};

export async function DetailsHeader({ item }: DetailsHeaderProps) {
  const songs =
    item.type === "song"
      ? [item]
      : "songs" in item && Array.isArray((item as { songs: unknown }).songs)
        ? (item as { songs: Song[] }).songs
        : [];

  const user = await getUser();

  let playlists, favorites;

  if (user) {
    [playlists, favorites] = await Promise.all([
      getUserPlaylists(user.id),
      getUserFavorites(user.id),
    ]);
  }

  const title = decode(
    "title" in item
      ? (item as { title: string }).title
      : (item as { name: string }).name,
  );

  const artistMap =
    "artist_map" in item
      ? (item as { artist_map: Album["artist_map"] }).artist_map
      : undefined;

  const albumUrl =
    "album_url" in item ? (item as { album_url: string }).album_url : undefined;

  const permaUrl = "url" in item ? (item as { url: string }).url : "";

  return (
    <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 shrink-0 overflow-hidden rounded-md border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64",
          (item.type === "artist" || item.type === "label") && "rounded-full",
        )}
      >
        <ImageWithFallback
          src={getImageSrc(item.image, "high")}
          width={200}
          height={200}
          alt={title}
          fallback={`/images/placeholder/${item.type}.jpg`}
          className={cn(
            "size-full rounded-md object-cover",
            (item.type === "artist" || item.type === "label") && "scale-105",
          )}
        />

        <Skeleton
          className={cn(
            "absolute inset-0 -z-10",
            (item.type === "artist" || item.type === "label") && "rounded-full",
          )}
        />
      </div>

      <figcaption className="flex min-w-0 w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
        <h1
          title={title}
          className="flex items-center truncate text-center font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:text-start"
        >
          {getExplicit(item) && (
            <Badge className="mr-2 rounded px-1 py-0 font-bold">E</Badge>
          )}
          {title}

          {getVerified(item) && (
            <BadgeCheck
              fill="#3b82f6"
              className="ml-2 inline-block text-background"
            />
          )}
        </h1>

        <div className="min-w-0 space-y-2 break-words text-sm text-muted-foreground">
          {(item.type === "song" || item.type === "episode") && (
            <>
              {item.type === "song" && (
                <p>
                  <Link
                    href={getHref(albumUrl ?? "", "album")}
                    className="hover:text-foreground"
                  >
                    {decode((item as Song).album)}
                  </Link>
                  {" by "}
                  {artistMap?.primary_artists?.map(
                    ({ id, name, url }, i, arr) => (
                      <Link
                        key={id}
                        href={getHref(url, "artist")}
                        className="hover:text-foreground"
                      >
                        {decode(name)}
                        {i !== arr.length - 1 && ", "}
                      </Link>
                    ),
                  )}
                </p>
              )}

              {item.type === "episode" && <p>{decode(item.subtitle)}</p>}

              <p className="capitalize">
                {item.type}
                {" · "}
                {(item as Song | Episode).play_count?.toLocaleString()} Plays
                {" · "}
                {formatDuration(
                  String(
                    (item as Song).duration ?? (item as Episode).duration ?? 0,
                  ),
                  "mm:ss",
                )}
                {" · "}
                {decode((item as Song | Episode).language)}
              </p>
            </>
          )}

          {item.type === "album" && (
            <>
              <p className="hidden lg:block">
                by{" "}
                {artistMap?.artists?.map(({ id, name, url }, i, arr) => (
                  <Link
                    key={id}
                    href={getHref(url, "artist")}
                    title={decode(name)}
                    className="hover:text-foreground"
                  >
                    {decode(name)}
                    {i !== arr.length - 1 && ","}
                  </Link>
                ))}
                {" · "}
                {(item as Album).song_count ?? 0} Songs
                {" · "}
                {((item as Album).play_count ?? 0).toLocaleString()} Plays
                {" · "}
                {formatDuration(Number((item as Album).duration) || 0, "mm:ss")}
              </p>

              <div className="text-center lg:hidden">
                <p>
                  by{" "}
                  {artistMap?.artists?.map(({ id, name, url }, i) => (
                    <Link
                      key={id}
                      href={getHref(url, "artist")}
                      title={decode(name)}
                      className="hover:text-foreground"
                    >
                      {decode(name)}
                      {i !== (artistMap.artists?.length ?? 0) - 1 && ","}
                    </Link>
                  ))}
                </p>

                <p className="capitalize">
                  {item.type}
                  {" · "}
                  {((item as Album).play_count ?? 0).toLocaleString()} Plays
                </p>
              </div>
            </>
          )}

          {item.type === "song" && (
            <p className="hidden w-fit text-sm text-muted-foreground hover:text-foreground lg:block">
              <Link href={(item as Song).label_url ?? "#"}>
                {decode((item as Song).copyright_text)}
              </Link>
            </p>
          )}

          {item.type === "playlist" && (
            <p className="capitalize">
              {decode(item.subtitle)}
              {" · "}
              {(item as Playlist).subtitle_desc
                .reverse()
                .map((s, i, arr) => s + (i !== arr.length - 1 ? " · " : ""))}
            </p>
          )}

          {item.type === "show" && (
            <p>
              Podcast{" · "}
              {((item as ShowDetails).fan_count ?? 0).toLocaleString()} Fans
            </p>
          )}

          {item.type === "artist" && (
            <p>
              Artist
              {" · "}
              {((item as Artist).fan_count ?? 0).toLocaleString()} Listeners
            </p>
          )}

          {item.type === "mix" && (
            <p>
              {decode((item as Mix).firstname)}
              {" · "}
              {decode((item as Mix).lastname)}
              {" · "}
              {(item as Mix).list_count ?? 0} Songs
            </p>
          )}

          {item.type === "label" && <p>Record Label</p>}
        </div>

        {item.type !== "label" && (
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-6">
            <PlayButton
              type={item.type}
              token={
                item.type === "show"
                  ? getId(item)
                  : (item.type === "artist"
                      ? (item as Artist).urls.songs
                      : permaUrl
                    )
                      .split("/")
                      .pop()!
              }
              className={cn(
                buttonVariants(),
                "rounded-full px-10 text-xl font-bold shadow-xs",
              )}
            >
              Play
            </PlayButton>

            <LikeButton
              user={user}
              type={item.type}
              token={getId(item)}
              name={title}
              favourites={favorites}
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "rounded-full shadow-xs",
              )}
            />

            <DownloadButton
              songs={songs ?? []}
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "rounded-full shadow-xs",
              )}
            />

            <MoreButton
              user={user}
              name={title}
              subtitle={decode(item.subtitle)}
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
