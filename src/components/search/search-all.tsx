import Image from "next/image";
import Link from "next/link";

import type { AllSearch } from "@/types";

import { cn, getHref, getImageSrc } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { Large } from "../ui/topography";

type Props = {
  query: string;
  data: AllSearch;
};

const SearchAll = ({ query, data }: Props) => {
  return (
    <div className="gap-2 space-y-4 md:grid md:grid-cols-2 md:space-y-0 lg:grid-cols-3 xl:grid-cols-4">
      {Object.entries(data)
        .sort(([, a], [, b]) => a.position - b.position)
        .map(([key, value]) => {
          if (!value.data.length) return null;

          return (
            <div key={key}>
              <div className="text-muted-foreground flex">
                <Large className="pl-2 capitalize">
                  {key.replace("_query", " Result")}
                </Large>

                {key !== "top_query" && (
                  <Link
                    href={`/search/${key.slice(0, -1)}/${query}`}
                    className="hover:bg-secondary hover:text-secondary-foreground ml-auto rounded-full border px-2 py-1 text-xs"
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
                  className="hover:bg-secondary flex gap-2 rounded-md p-2"
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

                    <div className="text-muted-foreground truncate text-xs capitalize">
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
};

export default SearchAll;
