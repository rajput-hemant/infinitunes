import type { MediaType } from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type DetailsHeaderSkeletonProps = {
  type: MediaType;
};

export function DetailsHeaderSkeleton({ type }: DetailsHeaderSkeletonProps) {
  const subtileSkeletonCount = (
    {
      album: 1,
      artist: 1,
      channel: 1,
      episode: 2,
      label: 0,
      mix: 1,
      playlist: 1,
      radio: 1,
      radio_station: 1,
      season: 1,
      show: 1,
      song: 3,
    } satisfies Record<MediaType, number>
  )[type];

  return (
    <div className="pointer-events-none mb-6 grid items-end justify-items-center gap-4 rounded-lg p-4 md:grid-cols-[auto_minmax(0,1fr)] md:justify-items-stretch md:gap-8 md:p-6">
      <Skeleton
        className={cn(
          "aspect-square w-[min(60vw,14rem)] rounded-md md:w-36 lg:w-44 min-[90rem]:w-56",
          (type === "artist" || type === "label") && "rounded-full",
        )}
      />

      <div className="flex min-w-0 w-full flex-col items-center md:items-start">
        <Skeleton className="h-4 w-20" />

        <Skeleton className="mt-1 mb-2 h-8 w-72 max-w-full md:h-10 md:w-96 lg:h-12" />

        <div className="flex w-full flex-col items-center gap-1 md:items-start">
          {Array.from({ length: subtileSkeletonCount }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-5 max-w-full"
              style={{ width: `${256 - i * 32}px` }}
            />
          ))}
        </div>

        {type !== "label" && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Skeleton className={cn(controlStyles.hero, "w-24")} />
            <Skeleton className={cn(controlStyles.hero, "w-24")} />
            <Skeleton className={controlStyles.headerIcon} />
            <Skeleton className={controlStyles.headerIcon} />
            <Skeleton className={controlStyles.headerIcon} />
            <Skeleton className={controlStyles.headerIcon} />
          </div>
        )}
      </div>
    </div>
  );
}
