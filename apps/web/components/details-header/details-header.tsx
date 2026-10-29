import { getImageSrc, parseToken, toSongRow } from "@infinitunes/types";
import { Badge } from "@infinitunes/ui/components/badge";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { BadgeCheck, Play, Shuffle } from "lucide-react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";
import { morphName } from "~/lib/view-transition";
import { getViewer } from "~/lib/viewer";

import { DownloadButton } from "../download-button";
import { GlassSurface } from "../glass/glass-surface";
import { ImageWithFallback } from "../image-with-fallback";
import { LikeButton } from "../like-button";
import { getPlaceholderSrc } from "../placeholder-src";
import { PlayButton } from "../play-button";
import { MorphArt } from "../view-transition/morph-target";
import { detailBandClassName } from "./details-header-band";
import { DetailsHeaderFrame } from "./details-header-frame";
import type { DetailsItem, DetailsKind } from "./details-header-items";
import {
  canShuffle,
  getExplicit,
  getId,
  getKind,
  getSongs,
  getSubtitle,
  getTitle,
  getVerified,
  isKind,
  isShowDetails,
} from "./details-header-items";
import { DetailsMeta } from "./details-header-meta";
import { MoreButton } from "./more-button";

const KIND_LABELS: Partial<Record<DetailsKind, string>> = {
  show: "Podcast",
  label: "Record label",
};

function getPlayToken(item: DetailsItem): string {
  if (isKind(item, "artist")) return parseToken(item.urls.songs);
  return parseToken("perma_url" in item ? item.perma_url : "");
}

type DetailsHeaderProps = {
  item: DetailsItem;
};

export async function DetailsHeader({ item }: DetailsHeaderProps) {
  const kind = getKind(item);
  const title = getTitle(item);
  // Only the slim row model reaches the header buttons (download, queue, radio).
  const songs = getSongs(item).map(toSongRow);

  const { user, playlists, favorites } = await getViewer();

  const playType = isShowDetails(item) ? "show" : kind;
  const playSeason = isShowDetails(item)
    ? Number(item.more_info.season_number)
    : undefined;
  const playToken = getPlayToken(item);

  const isRound = kind === "artist" || kind === "label";

  return (
    <DetailsHeaderFrame title={title} className={detailBandClassName}>
      <MorphArt
        name={morphName(kind, playToken)}
        className={cn(
          "relative aspect-square w-[min(60vw,14rem)] shrink-0 overflow-hidden rounded-md shadow-md md:w-36 lg:w-44 min-[90rem]:w-56",
          isRound && "rounded-full",
        )}
      >
        <ImageWithFallback
          src={getImageSrc(item.image, "high")}
          width={224}
          height={224}
          sizes="(min-width: 1440px) 224px, (min-width: 1024px) 176px, (min-width: 768px) 144px, min(60vw, 224px)"
          alt={title}
          fallback={getPlaceholderSrc(kind)}
          loading="eager"
          fetchPriority="high"
          className="size-full object-cover"
        />

        <Skeleton className="absolute inset-0 -z-10 rounded-none" />
      </MorphArt>

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

        {/* The badge sits beside the heading, not in it, so the h1's name is just the title. */}
        <div className="mt-1 mb-2 flex min-w-0 items-center justify-center md:justify-start">
          {getExplicit(item) && (
            <Badge className="mr-2 shrink-0 rounded px-1 py-0 font-bold">
              <span aria-hidden="true">E</span>
              <span className="sr-only">Explicit</span>
            </Badge>
          )}
          <h1
            title={title}
            className="min-w-0 font-heading text-[1.75rem] leading-8 font-extrabold tracking-[-0.03em] text-foreground break-words text-balance md:text-4xl md:leading-10 lg:text-[2.75rem] lg:leading-12"
          >
            {title}
          </h1>
        </div>

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

            {canShuffle(item) && (
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
            )}

            {/* The icon actions share one glass capsule over the artwork band; the buttons inside get fills, not their own glass. */}
            <GlassSurface
              size="s"
              glassRole="toolbar"
              className="inline-flex items-center gap-0.5 rounded-full p-0.5"
            >
              <LikeButton
                user={user}
                type={playType}
                token={getId(item)}
                linkToken={playType === "show" ? playToken : undefined}
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
                  "max-md:hidden",
                )}
              />

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
            </GlassSurface>
          </div>
        )}
      </figcaption>
    </DetailsHeaderFrame>
  );
}
