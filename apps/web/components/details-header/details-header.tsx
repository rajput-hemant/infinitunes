import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type {
  Album,
  Artist,
  ArtistMap,
  Episode,
  Label,
  Mix,
  Playlist,
  ShowDetails,
  Song,
} from "@infinitunes/types";
import {
  decode,
  formatCount,
  formatDuration,
  getImageSrc,
} from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { asRoute, cn, getHref } from "~/lib/utils";

import { DownloadButton } from "../download-button";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { getPlaceholderSrc } from "../placeholder-src";
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

/** " · N Plays", or nothing when upstream has no play count. */
function playsSegment(count: number | string | undefined): string {
  return countSegment(count, "Plays");
}

/** " · N Fans" / " · N Listeners", or nothing when the count is missing or zero. */
function countSegment(
  count: number | string | undefined,
  label: string,
): string {
  return Number(count) > 0 ? ` · ${formatCount(count)} ${label}` : "";
}

/** `Label` is the only DetailsItem variant with no raw `type`/`id` field (it has `labelId` instead). */
function isLabel(item: DetailsItem): item is Label {
  return "labelId" in item;
}

function getKind(
  item: DetailsItem,
): Exclude<DetailsItem, Label>["type"] | "label" {
  return isLabel(item) ? "label" : item.type;
}

function getId(item: DetailsItem): string {
  if (isLabel(item)) return item.labelId;
  if (item.type === "artist") return item.artistId;
  return item.id;
}

function getVerified(item: DetailsItem): boolean {
  return "isVerified" in item ? item.isVerified : false;
}

function getExplicit(item: DetailsItem): boolean {
  return "explicit_content" in item
    ? Boolean(Number(item.explicit_content))
    : false;
}

function getArtistMap(item: DetailsItem): ArtistMap | undefined {
  const info = (item as { more_info?: { artistMap?: ArtistMap } }).more_info;
  return info?.artistMap;
}

type DetailsHeaderProps = {
  item: DetailsItem;
};

export async function DetailsHeader({ item }: DetailsHeaderProps) {
  const kind = getKind(item);

  const list = "list" in item ? item.list : undefined;
  const songs =
    kind === "song" ? [item as Song] : Array.isArray(list) ? list : [];

  const albumDuration = Array.isArray(list)
    ? list.reduce(
        (sum, song) => sum + (Number(song.more_info.duration) || 0),
        0,
      )
    : 0;

  const user = await getUser();

  let playlists: MyPlaylist[] | undefined,
    favorites: Favorite | null | undefined;

  if (user) {
    [playlists, favorites] = await Promise.all([
      orFallback("user playlists", getUserPlaylists(), undefined),
      orFallback("user favorites", getUserFavorites(), null),
    ]);
  }

  const title = decode(
    "title" in item ? item.title : (item as { name: string }).name,
  );

  const artistMap = getArtistMap(item);

  const albumUrl =
    kind === "song" ? (item as Song).more_info.album_url : undefined;

  const permaUrl = "perma_url" in item ? item.perma_url : "";

  return (
    <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 shrink-0 overflow-hidden rounded-md border p-1 shadow-md transition-shadow duration-300 hover:shadow-xl md:w-56 xl:w-64",
          (kind === "artist" || kind === "label") && "rounded-full",
        )}
      >
        <ImageWithFallback
          src={getImageSrc(item.image, "high")}
          width={200}
          height={200}
          alt={title}
          fallback={getPlaceholderSrc(kind)}
          className={cn(
            "size-full rounded-md object-cover",
            (kind === "artist" || kind === "label") && "scale-105",
          )}
        />

        <Skeleton
          className={cn(
            "absolute inset-0 -z-10",
            (kind === "artist" || kind === "label") && "rounded-full",
          )}
        />
      </div>

      <figcaption className="flex min-w-0 w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
        <h1
          title={title}
          className="flex min-w-0 items-center justify-center font-heading text-xl drop-shadow-md text-foreground sm:text-2xl md:text-3xl lg:justify-start lg:text-start"
        >
          {getExplicit(item) && (
            <Badge className="mr-2 shrink-0 rounded px-1 py-0 font-bold">
              <span aria-hidden="true">E</span>
              <span className="sr-only">Explicit</span>
            </Badge>
          )}
          <span className="break-words text-balance">{title}</span>

          {getVerified(item) && (
            // Verified-badge blue is a brand convention; the theme has no blue token.
            <BadgeCheck
              aria-label="Verified"
              fill="#3b82f6"
              className="ml-2 inline-block shrink-0 text-background"
            />
          )}
        </h1>

        <div className="min-w-0 space-y-2 break-words text-sm text-muted-foreground">
          {(kind === "song" || kind === "episode") && (
            <>
              {kind === "song" && (
                <p>
                  <Link
                    href={getHref(albumUrl ?? "", "album")}
                    className="hover:text-foreground"
                  >
                    {decode((item as Song).more_info.album)}
                  </Link>
                  {" by "}
                  {artistMap?.primary_artists?.map(
                    ({ id, name, perma_url }, i, arr) => (
                      <Link
                        key={id}
                        href={getHref(perma_url, "artist")}
                        className="hover:text-foreground"
                      >
                        {decode(name)}
                        {i !== arr.length - 1 && ", "}
                      </Link>
                    ),
                  )}
                </p>
              )}

              {kind === "episode" && (
                <p>{decode((item as Episode).subtitle)}</p>
              )}

              <p className="capitalize">
                {kind}
                {playsSegment((item as Song | Episode).play_count)}
                {" · "}
                {formatDuration(
                  (item as Song | Episode).more_info.duration,
                  "mm:ss",
                )}
                {" · "}
                {decode((item as Song | Episode).language)}
              </p>
            </>
          )}

          {kind === "album" && (
            <>
              <p className="hidden lg:block">
                by{" "}
                {artistMap?.artists?.map(({ id, name, perma_url }, i, arr) => (
                  <Link
                    key={id}
                    href={getHref(perma_url, "artist")}
                    title={decode(name)}
                    className="hover:text-foreground"
                  >
                    {decode(name)}
                    {i !== arr.length - 1 && ","}
                  </Link>
                ))}
                {" · "}
                {formatCount((item as Album).more_info.song_count)} Songs
                {playsSegment((item as Album).play_count)}
                {" · "}
                {formatDuration(albumDuration, "mm:ss")}
              </p>

              <div className="text-center lg:hidden">
                <p>
                  by{" "}
                  {artistMap?.artists?.map(({ id, name, perma_url }, i) => (
                    <Link
                      key={id}
                      href={getHref(perma_url, "artist")}
                      title={decode(name)}
                      className="hover:text-foreground"
                    >
                      {decode(name)}
                      {i !== (artistMap.artists?.length ?? 0) - 1 && ","}
                    </Link>
                  ))}
                </p>

                <p className="capitalize">
                  {kind}
                  {playsSegment((item as Album).play_count)}
                </p>
              </div>
            </>
          )}

          {kind === "song" && (
            <p className="hidden w-fit text-sm text-muted-foreground hover:text-foreground lg:block">
              <Link href={asRoute((item as Song).more_info.label_url ?? "#")}>
                {decode((item as Song).more_info.copyright_text)}
              </Link>
            </p>
          )}

          {kind === "playlist" && (
            <p className="capitalize">
              {decode((item as Playlist).subtitle)}
              {" · "}
              {(item as Playlist).more_info.subtitle_desc
                .slice()
                .reverse()
                .map((s, i, arr) => s + (i !== arr.length - 1 ? " · " : ""))}
            </p>
          )}

          {kind === "season" && (
            <p>
              Podcast
              {countSegment((item as ShowDetails).more_info.fan_count, "Fans")}
            </p>
          )}

          {kind === "artist" && (
            <p>
              Artist
              {countSegment((item as Artist).fan_count, "Listeners")}
            </p>
          )}

          {kind === "mix" && (
            <p>
              {decode((item as Mix).more_info.firstname)}
              {" · "}
              {decode((item as Mix).more_info.lastname)}
              {" · "}
              {(item as Mix).list_count ?? 0} Songs
            </p>
          )}

          {kind === "label" && <p>Record Label</p>}
        </div>

        {kind !== "label" && (
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-6">
            <PlayButton
              type={kind === "season" ? "show" : kind}
              season={
                kind === "season"
                  ? Number((item as ShowDetails).more_info.season_number)
                  : undefined
              }
              token={
                kind === "season"
                  ? getId(item)
                  : (kind === "artist" ? (item as Artist).urls.songs : permaUrl)
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
              type={kind === "season" ? "show" : kind}
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
              subtitle={decode("subtitle" in item ? (item.subtitle ?? "") : "")}
              type={kind === "season" ? "show" : kind}
              image={item.image}
              songs={songs ?? []}
              playlists={playlists}
              artistId={
                kind === "artist" ? (item as Artist).artistId : undefined
              }
              language={
                kind === "artist"
                  ? (item as Artist).dominantLanguage
                  : songs[0]?.language
              }
            />
          </div>
        )}
      </figcaption>
    </figure>
  );
}
