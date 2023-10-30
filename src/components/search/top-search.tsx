import Image from "next/image";
import Link from "next/link";

import { getTopSearches } from "@/lib/jiosaavn-api";
import { getHref, getImageSrc } from "@/lib/utils";
import { ItemCard } from "../item-card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { Large } from "../ui/topography";

const TopSearch = async () => {
  const topSearches = await getTopSearches();

  return (
    <>
      <Large className="text-muted-foreground">Trending</Large>

      <ScrollArea className="lg:hidden">
        <div className="flex space-x-4 pb-4">
          {topSearches.map(({ id, name, url, subtitle, type, image }) => (
            <ItemCard
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
            className="hover:bg-secondary flex gap-2 rounded-md p-2"
          >
            <div className="relative aspect-square h-12 min-h-fit overflow-hidden rounded">
              <Image
                src={getImageSrc(t.image, "low")}
                alt={t.name}
                fill
                className="z-10 object-cover"
              />

              <Skeleton className="h-full w-full" />
            </div>

            <div className="my-auto w-[calc(100%-3rem)]">
              <div className="truncate text-sm font-medium">{t.name}</div>

              <div className="text-muted-foreground truncate text-xs capitalize">
                {t.subtitle}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
};

export default TopSearch;
