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
  parseToken,
} from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { BadgeCheck, Play, Shuffle } from "lucide-react";
import Link from "next/link";

import { getUser } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { asRoute, cn, getHref } from "~/lib/utils";

import { DownloadButton } from "../download-button";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { getPlaceholderSrc } from "../placeholder-src";
import { PlayButton } from "../play-button";
import { MoreButton } from "./more-button";
import { ShareButton } from "./share-button";

type DetailsItem =
  | Album
  | Song
  | Playlist
  | Artist
  | Episode
  | ShowDetails
  | Label
  | Mix;

/** "N Plays", or nothing when upstream has no play count. */
function playsLabel(count: number | string | undefined): string {
  return countLabel(count, "Plays");
}

/** "N Fans" / "N Listeners", or nothing when the count is missing or zero. */
function countLabel(count: number | string | undefined, label: string): string {
  return Number(count) > 0 ? `${formatCount(count)} ${label}` : "";
}

function joinMeta(parts: string[]): string {
  return parts.filter(Boolean).join(" · ");
}

const KIND_LABELS: Record<string, string> = {
  season: "Podcast",
  label: "Record label",
};

const metaLink = "font-semibold text-foreground hover:underline";

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

  const playType = kind === "season" ? "show" : kind;
  const playSeason =
    kind === "season"
      ? Number((item as ShowDetails).more_info.season_number)
      : undefined;
  const playToken =
    kind === "season"
      ? getId(item)
      : parseToken(kind === "artist" ? (item as Artist).urls.songs : permaUrl);

  const isRound = kind === "artist" || kind === "label";

  return (
    <figure className="relative isolate mb-6 grid items-end justify-items-center gap-4 overflow-hidden rounded-lg p-4 text-center md:grid-cols-[auto_minmax(0,1fr)] md:justify-items-stretch md:gap-8 md:p-6 md:text-start">
      <ImageWithFallback
        src={getImageSrc(item.image, "low")}
        alt=""
        fill
        sizes="50vw"
        fallback={getPlaceholderSrc(kind)}
        className="-z-20 object-cover opacity-(--ambient) [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)]"
      />

      <div
        className={cn(
          "relative aspect-square w-[min(60vw,14rem)] shrink-0 overflow-hidden rounded-md shadow-md md:w-36 lg:w-44 min-[90rem]:w-56",
          isRound && "rounded-full",
        )}
      >
        <ImageWithFallback
          src={getImageSrc(item.image, "high")}
          width={224}
          height={224}
          alt={title}
          fallback={getPlaceholderSrc(kind)}
          className="size-full object-cover"
        />

        <Skeleton className="absolute inset-0 -z-10 rounded-none" />
      </div>

      <figcaption className="flex min-w-0 w-full flex-col items-center overflow-hidden md:items-start">
        <div className="flex items-center gap-2 text-[0.6875rem] leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          <span>{KIND_LABELS[kind] ?? kind}</span>

          {getVerified(item) && (
            <span className="inline-flex items-center gap-1 text-primary">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Verified
            </span>
          )}
        </div>

        <h1
          title={title}
          className="mt-1 mb-2 flex min-w-0 items-center justify-center font-heading text-[1.75rem] leading-8 font-extrabold tracking-[-0.03em] text-foreground md:justify-start md:text-4xl md:leading-10 lg:text-[2.75rem] lg:leading-12"
        >
          {getExplicit(item) && (
            <Badge className="mr-2 shrink-0 rounded px-1 py-0 font-bold">
              <span aria-hidden="true">E</span>
              <span className="sr-only">Explicit</span>
            </Badge>
          )}
          <span className="min-w-0 break-words text-balance">{title}</span>
        </h1>

        <div className="flex min-w-0 flex-col gap-1 break-words text-sm text-muted-foreground">
          {kind === "song" && (
            <>
              <p>
                <Link
                  href={getHref(albumUrl ?? "", "album")}
                  className={metaLink}
                >
                  {decode((item as Song).more_info.album)}
                </Link>
                {" by "}
                {artistMap?.primary_artists?.map(
                  ({ id, name, perma_url }, i, arr) => (
                    <Link
                      key={id}
                      href={getHref(perma_url, "artist")}
                      className={metaLink}
                    >
                      {decode(name)}
                      {i !== arr.length - 1 && ", "}
                    </Link>
                  ),
                )}
              </p>

              <p>
                {joinMeta([
                  playsLabel((item as Song).play_count),
                  formatDuration((item as Song).more_info.duration, "mm:ss"),
                  decode((item as Song).language),
                ])}
              </p>

              <p className="hidden w-fit md:block">
                <Link
                  href={asRoute((item as Song).more_info.label_url ?? "#")}
                  className="hover:text-foreground"
                >
                  {decode((item as Song).more_info.copyright_text)}
                </Link>
              </p>
            </>
          )}

          {kind === "episode" && (
            <>
              <p>{decode((item as Episode).subtitle)}</p>

              <p>
                {joinMeta([
                  playsLabel((item as Episode).play_count),
                  formatDuration((item as Episode).more_info.duration, "mm:ss"),
                  decode((item as Episode).language),
                ])}
              </p>
            </>
          )}

          {kind === "album" && (
            <p>
              by{" "}
              {artistMap?.artists?.map(({ id, name, perma_url }, i, arr) => (
                <Link
                  key={id}
                  href={getHref(perma_url, "artist")}
                  title={decode(name)}
                  className={metaLink}
                >
                  {decode(name)}
                  {i !== arr.length - 1 && ","}
                </Link>
              ))}
              {" · "}
              {joinMeta([
                `${formatCount((item as Album).more_info.song_count)} Songs`,
                playsLabel((item as Album).play_count),
                formatDuration(albumDuration, "mm:ss"),
              ])}
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
              {countLabel((item as ShowDetails).more_info.fan_count, "Fans")}
            </p>
          )}

          {kind === "artist" && (
            <p>{countLabel((item as Artist).fan_count, "Listeners")}</p>
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
        </div>

        {kind !== "label" && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <PlayButton
              type={playType}
              season={playSeason}
              token={playToken}
              className={cn(
                buttonVariants(),
                controlStyles.hero,
                "text-sm font-semibold",
              )}
            >
              <Play aria-hidden="true" className="size-4 fill-current" />
              Play
            </PlayButton>

            <PlayButton
              shuffle
              type={playType}
              season={playSeason}
              token={playToken}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                controlStyles.hero,
                "text-sm font-semibold",
              )}
            >
              <Shuffle aria-hidden="true" className="size-4" />
              Shuffle
            </PlayButton>

            <LikeButton
              user={user}
              type={kind === "season" ? "show" : kind}
              token={getId(item)}
              name={title}
              favourites={favorites}
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                controlStyles.headerIcon,
              )}
            />

            <DownloadButton
              songs={songs ?? []}
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                controlStyles.headerIcon,
              )}
            />

            <ShareButton title={title} />

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
