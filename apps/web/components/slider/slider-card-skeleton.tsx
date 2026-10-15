import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { cn } from "~/lib/utils";

export type SliderCardSkeletonProps = {
  aspect?: "square" | "video";
  rounded?: boolean;
  hideSubtitle?: boolean;
};

/** Mirrors `SliderCard`: art, 8px gap, 20px title line, 16px subtitle line. */
export function SliderCardSkeleton(props: SliderCardSkeletonProps) {
  const { aspect, rounded, hideSubtitle } = props;

  return (
    <div className="pointer-events-none flex w-full min-w-0 flex-col gap-2">
      <Skeleton
        className={cn(
          "w-full rounded-md",
          aspect === "video" ? "aspect-video" : "aspect-square",
          rounded && "rounded-full",
        )}
      />

      <div className={cn("flex flex-col", rounded && "items-center")}>
        <div className="flex h-5 w-full items-center justify-center">
          <Skeleton className={cn("h-3 w-4/5", !rounded && "mr-auto")} />
        </div>

        {!hideSubtitle && (
          <div className="flex h-4 w-full items-center justify-center">
            <Skeleton className={cn("h-2 w-1/2", !rounded && "mr-auto")} />
          </div>
        )}
      </div>
    </div>
  );
}
