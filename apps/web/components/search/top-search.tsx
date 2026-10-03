import { decode, getImageSrc } from "@infinitunes/types";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import Image from "next/image";
import Link from "next/link";

import { api } from "~/lib/trpc/server";
import { getHref } from "~/lib/utils";

import { SliderCard } from "../slider/slider-card";

export async function TopSearch() {
  const topSearches = await api.search.top({});

  return (
    <>
      <h3 className="font-heading text-xl drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
        Trending Searches
      </h3>

      <ScrollArea className="lg:hidden">
        <div className="flex space-x-4 pb-4">
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

      <div className="hidden max-w-5xl gap-2 md:grid-cols-2 lg:grid lg:grid-cols-3">
        {topSearches.map((t) => (
          <Link
            key={t.id}
            href={getHref(t.perma_url, t.type)}
            className="flex gap-2 rounded-md p-2 hover:bg-secondary"
          >
            <div className="relative aspect-square h-12 shrink-0 overflow-hidden rounded">
              <Image
                src={getImageSrc(t.image, "low")}
                alt=""
                fill
                sizes="48px"
                className="z-10 object-cover"
              />

              <Skeleton className="size-full" />
            </div>

            <div className="my-auto min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {decode(t.title)}
              </div>

              <div className="truncate text-xs capitalize text-muted-foreground">
                {t.subtitle ? decode(t.subtitle) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
