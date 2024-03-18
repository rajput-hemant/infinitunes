import Image from "next/image";
import Link from "next/link";

import type { AllSearch } from "@/types";

import { cn, getHref, getImageSrc } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { Large } from "../ui/topography";

type SearchAllProps = {
  query: string;
  data: AllSearch;
};

export function SearchAll({ query, data }: SearchAllProps) {
  return (
    <div className="gap-2 space-y-4 md:grid md:grid-cols-2 md:space-y-0 lg:grid-cols-3 xl:grid-cols-4">
      {Object.entries(data)
        .sort(([, a], [, b]) => a.position - b.position)
        .map(([key, value]) => {
          if (!value.data.length) return null;

          return (
            <div key={key}>
              <div className="flex text-muted-foreground">
                <Large className="pl-2 capitalize">
                  {key.replace("_query", " Result")}
                </Large>

                {key !== "top_query" && (
                  <Link
                    href={`/search/${key.slice(0, -1)}/${query}`}
                    className="ml-auto rounded-full border px-2 py-1 text-xs hover:bg-secondary hover:text-secondary-foreground"
                  >
                    View all
                  </Link>
                )}
              </div>

              <Separator className="my-2" />

              {value.data.map((t) => (
                <Link
                  key={t.id}
                  href={getHref(t.url, t.type)}
                  className="flex gap-2 rounded-md p-2 hover:bg-secondary"
                >
                  <div className="relative aspect-square h-12 min-h-fit overflow-hidden rounded border">
                    <Image
                      src={getImageSrc(t.image, "low")}
                      alt={t.name}
                      fill
                      className={cn(
                        "z-10 object-cover",
                        getImageSrc(t.image, "low").includes("default") &&
                          "dark:invert"
                      )}
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
          );
        })}
    </div>
  );
}
