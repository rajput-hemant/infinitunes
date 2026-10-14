import type { Playlist } from "@infinitunes/types";
import { decode, getImageSrc, parseToken } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";
import Link from "next/link";

import { GlassSurface } from "~/components/glass/glass-surface";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { PlayButton } from "~/components/play-button";
import { controlStyles } from "~/lib/control-styles";
import { cn, getHref } from "~/lib/utils";

type HomeHeroProps = {
  playlist: Playlist;
};

export function HomeHero({ playlist }: HomeHeroProps) {
  const title = decode(playlist.title);
  const href = getHref(playlist.perma_url, "playlist");

  return (
    <div className="relative isolate flex min-h-60 items-end overflow-hidden rounded-lg shadow-md md:min-h-64 xl:min-h-72">
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
        sizes="(min-width: 1024px) 55vw, 100vw"
        alt=""
        loading="eager"
        fetchPriority="high"
        className="-z-20 rounded-none object-cover object-[center_20%] saturate-[1.1]"
      />

      {/* Image scrim: stays dark over arbitrary artwork in both themes, so it is not a theme token. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-black/50 via-black/10 to-transparent"
      />

      {/* The caption is glass over the artwork: its rim bends the cover behind it, the text stays crisp. */}
      <GlassSurface
        variant="clear"
        size="m"
        preset="thick"
        className="m-3 grid max-w-104 gap-2 rounded-lg px-4 py-4 md:m-4 md:px-5"
      >
        <p className="text-[0.6875rem] leading-4 font-semibold tracking-[0.06em] uppercase opacity-80">
          Featured playlist
        </p>

        <h2 className="font-heading text-xl leading-7 font-bold tracking-[-0.02em] md:text-2xl md:leading-8">
          <Link
            href={href}
            className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {title}
          </Link>
        </h2>

        {playlist.subtitle && (
          <p className="hidden text-sm leading-5 opacity-80 md:block">
            {decode(playlist.subtitle)}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <PlayButton
            aria-label={`Play ${title}`}
            type="playlist"
            token={parseToken(playlist.perma_url)}
            className={cn(
              buttonVariants(),
              controlStyles.hero,
              "text-sm font-semibold",
            )}
          >
            <Play aria-hidden="true" className="size-4 fill-current" />
            Play
          </PlayButton>
        </div>
      </GlassSurface>
    </div>
  );
}
