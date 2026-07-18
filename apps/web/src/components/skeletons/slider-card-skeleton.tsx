import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

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
        "pointer-events-none w-32 rounded-md sm:w-36 sm:border md:w-48 lg:w-56",
        aspect === "video" && "w-44 border-none sm:w-48 md:w-64 lg:w-72"
      )}
    >
      <div className="size-full p-2">
        <Skeleton
          className={cn(
            aspect === "video" ?
              "aspect-video w-[160px] sm:w-[176px] md:w-[240px] lg:w-[272px]"
            : "size-28 sm:size-[126px] md:size-[174px] lg:size-[206px]",
            rounded && "rounded-full"
          )}
        />

        <div className="mt-1 space-y-1 lg:space-y-1.5">
          <Skeleton className={cn("h-6 w-full", hideSubtitle && "md:h-7")} />

          {!hideSubtitle && <Skeleton className="h-3 w-full lg:h-3.5" />}
        </div>
      </div>
    </div>
  );
}
