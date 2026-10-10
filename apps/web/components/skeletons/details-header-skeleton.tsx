import type { MediaType } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type DetailsHeaderSkeletonProps = {
  type: MediaType;
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
    } satisfies Record<MediaType, number>
  )[type];

  return (
    <div className="pointer-events-none mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 overflow-hidden rounded-md border p-1 shadow-md transition-shadow duration-300 hover:shadow-xl md:w-56 xl:w-64",
          (type === "artist" || type === "label") && "rounded-full",
        )}
      >
        <Skeleton
          className={cn(
            "absolute inset-1",
            (type === "artist" || type === "label") && "rounded-full",
          )}
        />
      </div>

      <div className="flex min-w-0 w-full flex-col items-center justify-center font-medium lg:items-start lg:gap-2 lg:p-1">
        <div className="space-y-2">
          <Skeleton className="h-6 w-72 max-w-full sm:h-7 md:h-8 md:w-96 lg:h-9" />

          <div className="space-y-2 text-sm text-muted-foreground">
            {Array.from({ length: subtileSkeletonCount }).map((_, i) => (
              <Skeleton
                key={i}
                className="mx-auto h-5 max-w-full lg:mx-0"
                style={{ width: `${256 - i * 32}px` }}
              />
            ))}
          </div>
        </div>

        {type !== "label" && (
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-6">
            <Button
              className={cn(
                controlStyles.hero,
                "text-base font-semibold text-primary",
              )}
            >
              Play
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={controlStyles.heroIcon}
            >
              <Skeleton className="size-5 rounded-full" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={controlStyles.heroIcon}
            >
              <Skeleton className="size-5 rounded-full" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={controlStyles.heroIcon}
            >
              <Skeleton className="size-5 rounded-full" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
