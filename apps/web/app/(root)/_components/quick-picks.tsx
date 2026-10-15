import { getImageSrc, uniqueBy } from "@infinitunes/types";
import type { MediaType, Quality } from "@infinitunes/types";
import { Play } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { PlayButton } from "~/components/play-button";

export type QuickPickItem = {
  key: string;
  href: Route;
  title: string;
  image: Quality;
  type: MediaType;
  token: string;
};

type QuickPicksProps = {
  items: QuickPickItem[];
};

export function QuickPicks({ items }: QuickPicksProps) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
        Quick picks
      </h2>

      <ul className="grid grid-cols-2 content-start gap-2">
        {uniqueBy(items, (item) => item.key).map(
          ({ key, href, title, image, type, token }) => (
            <li key={key} className="group relative">
              <Link
                href={href}
                className="flex h-12 items-center gap-2 overflow-hidden rounded-sm bg-fill pr-3 text-[0.8125rem] leading-5 font-semibold transition-colors duration-fast hover:bg-fill-2 active:scale-98 md:h-14 md:gap-3 motion-reduce:transition-none"
              >
                <ImageWithFallback
                  src={getImageSrc(image, "medium")}
                  fallback={getPlaceholderSrc("album")}
                  width={56}
                  height={56}
                  alt=""
                  className="size-12 shrink-0 rounded-none object-cover md:size-14"
                />

                <span className="truncate">{title}</span>
              </Link>

              {/* Over the thumbnail, a sibling of the link. Touch taps open the page instead. */}
              <PlayButton
                aria-label={`Play ${title}`}
                type={type}
                token={token}
                data-card-play="thumb"
                className="absolute top-0 left-0 flex size-12 items-center justify-center rounded-sm bg-black/45 text-white opacity-0 outline-none transition-opacity duration-fast group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none pointer-coarse:hidden md:size-14"
              >
                <Play aria-hidden="true" className="size-5 fill-current" />
              </PlayButton>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
