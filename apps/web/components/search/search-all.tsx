import type { Quality, MediaType } from "@infinitunes/types";
import type { AllSearch } from "@infinitunes/types";
import { Separator } from "@infinitunes/ui/components/separator";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import Link from "next/link";

import { cn, getHref, getImageSrc } from "~/lib/utils";

import { ImageWithFallback } from "../image-with-fallback";

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
            <section key={key}>
              <div className="flex">
                <p className="pl-2 font-heading text-lg capitalize tracking-wider drop-shadow-sm">
                  {key.replace("_query", " Result")}
                </p>

                {key !== "top_query" && (
                  <Link
                    href={`/search/${key.slice(0, -1)}/${query}`}
                    className="ml-auto rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  >
                    View all
                  </Link>
                )}
              </div>

              <Separator className="my-2" />

              {value.data.map((item) => {
                const t = item as unknown as {
                  id: string;
                  name: string;
                  url: string;
                  subtitle?: string;
                  type: MediaType;
                  image: Quality;
                };
                return (
                  <Link
                    key={t.id}
                    href={getHref(t.url, t.type)}
                    className="flex gap-2 rounded-md p-2 hover:bg-secondary"
                  >
                    <div className="relative aspect-square h-12 min-h-fit overflow-hidden rounded border">
                      <ImageWithFallback
                        src={getImageSrc(t.image, "low")}
                        alt={t.name}
                        fill
                        className={cn(
                          "z-10 object-cover",
                          getImageSrc(t.image, "low").includes("default") &&
                            "dark:invert",
                        )}
                        fallback={`/images/placeholder/${t.type}.jpg`}
                      />

                      <Skeleton className="size-full" />
                    </div>

                    <div className="my-auto w-[calc(100%-3rem)]">
                      <div className="truncate text-sm font-medium">
                        {t.name}
                      </div>

                      <div className="truncate text-xs capitalize text-muted-foreground">
                        {t.subtitle}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          );
        })}
    </div>
  );
}
