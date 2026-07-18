import type { Type } from "@/types";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

type DetailsHeaderSkeletonProps = {
  type: Type;
};

export function DetailsHeaderSkeleton({ type }: DetailsHeaderSkeletonProps) {
  const subtileSkeletonCount = (
    {
      album: 2,
      artist: 1,
      channel: 1,
      episode: 3,
      label: 1,
      mix: 1,
      playlist: 1,
      radio: 1,
      radio_station: 1,
      season: 2,
      show: 2,
      song: 3,
    } satisfies Record<Type, number>
  )[type];

  return (
    <div className="pointer-events-none mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 overflow-hidden rounded-md border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64",
          (type === "artist" || type === "label") && "rounded-full"
        )}
      >
        <Skeleton
          className={cn(
            "absolute inset-1",
            (type === "artist" || type === "label") && "rounded-full"
          )}
        />
      </div>

      <div className="flex flex-col items-center justify-center font-medium lg:items-start lg:gap-2 lg:p-1">
        <div className="space-y-2">
          <Skeleton className="h-6 w-72 sm:h-7 md:h-8 md:w-96 lg:h-9" />

          <div className="space-y-2 text-sm text-muted-foreground">
            {Array.from({ length: subtileSkeletonCount }).map((_, i) => (
              <Skeleton
                key={i}
                className="mx-auto h-5 lg:mx-0"
                style={{ width: `${256 - i * 32}px` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 lg:mt-6">
          <Button className="rounded-full px-10 text-xl font-bold text-primary shadow-sm">
            Play
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-sm"
          >
            <Skeleton className="size-5 rounded-full" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-sm"
          >
            <Skeleton className="size-5 rounded-full" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-sm"
          >
            <Skeleton className="size-5 rounded-full" />
          </Button>
        </div>
      </div>
    </div>
  );
}
