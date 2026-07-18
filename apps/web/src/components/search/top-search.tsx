import Image from "next/image";
import Link from "next/link";

import { getTopSearches } from "@/lib/jiosaavn-api";
import { getHref, getImageSrc } from "@/lib/utils";
import { SliderCard } from "../slider";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

export async function TopSearch() {
  const topSearches = await getTopSearches();

  return (
    <>
      <p className="font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        Trending Searches
      </p>

      <ScrollArea className="lg:hidden">
        <div className="flex space-x-4 pb-4">
          {topSearches.map(({ id, name, url, subtitle, type, image }) => (
            <SliderCard
              key={id}
              name={name}
              url={url}
              subtitle={subtitle}
              type={type}
              image={image}
            />
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="hidden max-w-5xl gap-2 md:grid-cols-2 lg:grid lg:grid-cols-3">
        {topSearches.map((t) => (
          <Link
            key={t.id}
            href={getHref(t.url, t.type)}
            className="flex gap-2 rounded-md p-2 hover:bg-secondary"
          >
            <div className="relative aspect-square h-12 min-h-fit overflow-hidden rounded">
              <Image
                src={getImageSrc(t.image, "low")}
                alt={t.name}
                fill
                className="z-10 object-cover"
              />

              <Skeleton className="size-full" />
            </div>

            <div className="my-auto w-[calc(100%-3rem)]">
              <div className="truncate text-sm font-medium">{t.name}</div>

              <div className="truncate text-xs capitalize text-muted-foreground">
                {t.subtitle}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
