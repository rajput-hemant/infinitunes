import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { cn } from "~/lib/utils";

type SliderCardSkeletonProps = {
  aspect?: "square" | "video";
  rounded?: boolean;
  hideSubtitle?: boolean;
};

export function SliderCardSkeleton(props: SliderCardSkeletonProps) {
  const { aspect, rounded, hideSubtitle } = props;

  return (
    <div
      className={cn(
        "pointer-events-none w-32 shrink-0 rounded-md sm:w-36 md:w-48 lg:w-56",
        aspect === "video" && "w-44 sm:w-48 md:w-64 lg:w-72",
      )}
    >
      <div className="size-full p-2">
        <Skeleton
          className={cn(
            "w-full",
            aspect === "video" ? "aspect-video" : "aspect-square",
            rounded && "rounded-full",
          )}
        />

        <div className="mt-1">
          <Skeleton className="h-6 w-full lg:h-7" />

          {!hideSubtitle && <Skeleton className="mt-1 h-3 w-full" />}
        </div>
      </div>
    </div>
  );
}
