import { getImageSrc } from "@infinitunes/types";
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

export function QuickPicks({ items }: QuickPicksProps) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
        Quick picks
      </h2>

      <ul className="grid grid-cols-2 content-start gap-2">
        {items.map(({ key, href, title, image }) => (
          <li key={key}>
            <Link
              href={href}
              className="flex h-12 items-center gap-2 overflow-hidden rounded-sm bg-fill pr-3 text-[0.8125rem] leading-5 font-semibold transition-colors duration-fast hover:bg-fill-2 active:scale-98 md:h-14 md:gap-3 motion-reduce:transition-none"
            >
              <ImageWithFallback
                src={getImageSrc(image, "high")}
                fallback={getPlaceholderSrc("album")}
                width={56}
                height={56}
                alt=""
                className="size-12 shrink-0 rounded-none object-cover md:size-14"
              />

              <span className="truncate">{title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
