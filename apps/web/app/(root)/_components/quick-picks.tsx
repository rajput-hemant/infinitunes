import { getImageSrc, uniqueBy } from "@infinitunes/types";
import type { MediaType, Quality } from "@infinitunes/types";
import type { Route } from "next";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";

export type QuickPickItem = {
  key: string;
  type: MediaType;
  href: Route;
  title: string;
  image: Quality;
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
          ({ key, type, href, title, image }) => (
            <li key={key}>
              <Link
                href={href}
                data-morph={type}
                className="flex h-12 items-center gap-2 overflow-hidden rounded-sm bg-fill pr-3 text-[0.8125rem] leading-5 font-semibold transition-colors duration-fast hover:bg-fill-2 active:scale-98 md:h-14 md:gap-3 motion-reduce:transition-none"
              >
                <span
                  data-morph-art=""
                  className="block size-12 shrink-0 overflow-hidden md:size-14"
                >
                  <ImageWithFallback
                    src={getImageSrc(image, "medium")}
                    fallback={getPlaceholderSrc("album")}
                    width={56}
                    height={56}
                    alt=""
                    className="size-full rounded-none object-cover"
                  />
                </span>

                <span className="truncate">{title}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
