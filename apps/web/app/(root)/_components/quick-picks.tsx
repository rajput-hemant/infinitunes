import { getImageSrc, uniqueBy } from "@infinitunes/types";
import type { Quality } from "@infinitunes/types";
import type { Route } from "next";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";

export type QuickPickItem = {
  key: string;
  href: Route;
  title: string;
  image: Quality;
};

type QuickPicksProps = {
  items: QuickPickItem[];
};

// From lg the section sits beside the bento: it adds no height of its own (h-0) and is stretched to the
// bento's (min-h-full), and its rows share what is left under the heading.
export function QuickPicks({ items }: QuickPicksProps) {
  return (
    <section className="flex flex-col xl:h-0 xl:min-h-full">
      <h2 className="mb-3 font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
        Quick picks
      </h2>

      <ul className="grid grid-cols-2 content-start gap-2 xl:min-h-0 xl:flex-1 xl:auto-rows-fr">
        {uniqueBy(items, (item) => item.key).map(
          ({ key, href, title, image }) => (
            <li key={key} className="min-h-0">
              <Link
                href={href}
                className="flex h-12 items-center gap-2 overflow-hidden rounded-sm bg-fill pr-3 text-[0.8125rem] leading-5 font-semibold transition-colors duration-fast hover:bg-fill-2 active:scale-98 md:h-14 md:gap-3 xl:h-full xl:text-sm motion-reduce:transition-none"
              >
                <ImageWithFallback
                  src={getImageSrc(image, "medium")}
                  fallback={getPlaceholderSrc("album")}
                  width={56}
                  height={56}
                  alt=""
                  className="size-12 shrink-0 rounded-none object-cover md:size-14 xl:aspect-square xl:h-full xl:w-auto"
                />

                <span className="line-clamp-2 min-w-0">{title}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
