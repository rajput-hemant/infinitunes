import type { Playlist, Quality } from "@infinitunes/types";
import { decode, getImageSrc, parseToken } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { GlassSurface } from "~/components/glass/glass-surface";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { PlayButton } from "~/components/play-button";
import { controlStyles } from "~/lib/control-styles";
import { cn, getHref } from "~/lib/utils";

export type HeroTile = {
  key: string;
  href: Route;
  title: string;
  image: Quality;
};

type HomeHeroProps = {
  playlist: Playlist;
  tiles: HeroTile[];
};

const MAX_TILES = 4;

/**
 * Bento hero. Artwork is square, so every tile is square and the grid is
 * four columns by two rows: the featured tile spans 2x2 and the small tiles
 * (each `aspect-square`) set the row height, so the featured tile comes out
 * exactly square too and nothing is cropped or letterboxed. Below `md` the
 * featured tile spans the full width with the first two tiles in a 2-up row.
 */
export function HomeHero({ playlist, tiles }: HomeHeroProps) {
  const title = decode(playlist.title);
  const href = getHref(playlist.perma_url, "playlist");

  return (
    <div className="grid grid-cols-2 content-start gap-2 md:grid-cols-4 md:gap-3">
      <div className="group/tile relative isolate col-span-2 aspect-square overflow-hidden rounded-lg shadow-md transition-transform duration-fast hover:-translate-y-0.5 motion-reduce:transition-none md:row-span-2 md:aspect-auto">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0"
        />

        <ImageWithFallback
          src={getImageSrc(playlist.image, "high")}
          fallback={getPlaceholderSrc("playlist")}
          fill
          sizes="(min-width: 1024px) 28vw, (min-width: 768px) 50vw, 100vw"
          alt=""
          loading="eager"
          fetchPriority="high"
          className="-z-20 rounded-none object-cover"
        />

        {/* Image scrim: stays dark over arbitrary artwork in both themes, so it is not a theme token. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-black/45 via-transparent to-transparent"
        />

        {/* Compact glass strip anchored to the bottom: the faces above it stay visible. */}
        <GlassSurface
          variant="clear"
          size="m"
          preset="thick"
          className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-md py-2 pr-2 pl-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.625rem] leading-3.5 font-semibold tracking-[0.06em] uppercase opacity-80">
              Featured playlist
            </p>

            <h2 className="truncate font-heading text-base leading-6 font-bold tracking-[-0.02em]">
              <Link
                href={href}
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {title}
              </Link>
            </h2>
          </div>

          <PlayButton
            aria-label={`Play ${title}`}
            type="playlist"
            token={parseToken(playlist.perma_url)}
            className={cn(
              buttonVariants(),
              controlStyles.hero,
              "shrink-0 text-sm font-semibold",
            )}
          >
            <Play aria-hidden="true" className="size-4 fill-current" />
            Play
          </PlayButton>
        </GlassSurface>
      </div>

      {tiles
        .slice(0, MAX_TILES)
        .map(({ key, href: tileHref, title: tileTitle, image }) => (
          <Link
            key={key}
            href={tileHref}
            aria-label={tileTitle}
            title={tileTitle}
            className="group/tile relative isolate block aspect-square overflow-hidden rounded-md shadow-sm outline-none transition-transform duration-fast hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring max-md:nth-[n+4]:hidden motion-reduce:transition-none"
          >
            <ImageWithFallback
              src={getImageSrc(image, "high")}
              fallback={getPlaceholderSrc("playlist")}
              fill
              sizes="(min-width: 1024px) 14vw, (min-width: 768px) 25vw, 50vw"
              loading="lazy"
              alt=""
              className="-z-20 rounded-none object-cover"
            />
          </Link>
        ))}
    </div>
  );
}
