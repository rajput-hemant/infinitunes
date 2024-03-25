import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

type SliderCardSkeletonProps = {
  aspect?: "square" | "video";
};

export function SliderCardSkeleton({ aspect }: SliderCardSkeletonProps) {
  return (
    <div
      className={cn(
        "w-32 rounded-md sm:w-36 sm:border md:w-48 lg:w-56",
        aspect === "video" && "w-44 border-none sm:w-48 md:w-64 lg:w-72"
      )}
    >
      <div className="size-full p-2">
        <Skeleton
          className={cn(
            aspect === "video" ?
              "aspect-video w-[160px] sm:w-[176px] md:w-[240px] lg:w-[272px]"
            : "size-28 sm:size-[126px] md:size-[174px] lg:size-[206px]"
          )}
        />

        <div className="mt-1 space-y-1 lg:space-y-1.5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-3 w-full lg:h-3.5" />
        </div>
      </div>
    </div>
  );
}
