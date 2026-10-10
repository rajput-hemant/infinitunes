import { decode, getImageSrc } from "@infinitunes/types";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { api } from "~/lib/trpc/server";
import { getHref } from "~/lib/utils";

import { SliderCard } from "../slider/slider-card";
import { searchUi } from "./search-ui";

export async function TopSearch() {
  const topSearches = await api.search.top();

  return (
    <section className="space-y-6 px-2 pb-2">
      <div>
        <div className={searchUi.sectionHeader}>
          <h2>Trending searches</h2>
        </div>

        <ScrollArea className="lg:hidden">
          <div className="flex gap-4 pb-2">
            {topSearches.map(
              ({ id, title, perma_url, subtitle, type, image }) => (
                <SliderCard
                  key={id}
                  name={title}
                  url={perma_url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                />
              ),
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="hidden space-y-0.5 lg:block">
          {topSearches.map((t) => (
            <Link
              key={t.id}
              href={getHref(t.perma_url, t.type)}
              data-search-palette-row
              role="option"
              className={searchUi.paletteRow}
            >
              <div className={searchUi.paletteArt}>
                <ImageWithFallback
                  src={getImageSrc(t.image, "low")}
                  alt=""
                  fill
                  sizes="36px"
                  fallback={getPlaceholderSrc(t.type)}
                  className="z-10 object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {decode(t.title)}
                </div>
                {t.subtitle ? (
                  <div className="truncate text-xs capitalize text-muted-foreground">
                    {decode(t.subtitle)}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
