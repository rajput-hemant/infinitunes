import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import { getImageSrc, parseToken } from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { BadgeCheck, Play, Shuffle } from "lucide-react";

import { getUser } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { cn } from "~/lib/utils";

import { DownloadButton } from "../download-button";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { getPlaceholderSrc } from "../placeholder-src";
import { PlayButton } from "../play-button";
import { detailBandClassName } from "./details-header-band";
import { DetailsHeaderFrame } from "./details-header-frame";
import type { DetailsItem, DetailsKind } from "./details-header-items";
import {
  getExplicit,
  getId,
  getKind,
  getSongs,
  getSubtitle,
  getTitle,
  getVerified,
  isKind,
} from "./details-header-items";
import { DetailsMeta } from "./details-header-meta";
import { MoreButton } from "./more-button";
import { ShareButton } from "./share-button";

const KIND_LABELS: Partial<Record<DetailsKind, string>> = {
  season: "Podcast",
  label: "Record label",
};

function getPlayToken(item: DetailsItem): string {
  if (isKind(item, "season")) return getId(item);
  if (isKind(item, "artist")) return parseToken(item.urls.songs);
  return parseToken("perma_url" in item ? item.perma_url : "");
}

type DetailsHeaderProps = {
  item: DetailsItem;
};

export async function DetailsHeader({ item }: DetailsHeaderProps) {
  const kind = getKind(item);
  const title = getTitle(item);
  const songs = getSongs(item);

  const user = await getUser();

  let playlists: MyPlaylist[] | undefined,
    favorites: Favorite | null | undefined;

  if (user) {
    [playlists, favorites] = await Promise.all([
      orFallback("user playlists", getUserPlaylists(), undefined),
      orFallback("user favorites", getUserFavorites(), null),
    ]);
  }

  const playType = kind === "season" ? "show" : kind;
  const playSeason = isKind(item, "season")
    ? Number(item.more_info.season_number)
    : undefined;
  const playToken = getPlayToken(item);

  const isRound = kind === "artist" || kind === "label";

  return (
    <DetailsHeaderFrame title={title} className={detailBandClassName}>
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

        <DetailsMeta item={item} />

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
              type={playType}
              token={getId(item)}
              name={title}
              favourites={favorites}
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                controlStyles.headerIcon,
              )}
            />

            <DownloadButton
              songs={songs}
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                controlStyles.headerIcon,
              )}
            />

            <ShareButton title={title} />

            <MoreButton
              user={user}
              name={title}
              subtitle={getSubtitle(item)}
              type={playType}
              image={item.image}
              songs={songs}
              playlists={playlists}
              artistId={isKind(item, "artist") ? item.artistId : undefined}
              language={
                isKind(item, "artist")
                  ? item.dominantLanguage
                  : songs[0]?.language
              }
            />
          </div>
        )}
      </figcaption>
    </DetailsHeaderFrame>
  );
}
