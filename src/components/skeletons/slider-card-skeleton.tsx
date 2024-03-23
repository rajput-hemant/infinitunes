import { Skeleton } from "../ui/skeleton";

export function SliderCardSkeleton() {
  return (
    <div className="w-32 rounded-md sm:w-36 sm:border md:w-48 lg:w-56">
      <div className="size-full p-2">
        <Skeleton className="size-28 sm:size-[126px] md:size-[174px] lg:size-[206px]" />

        <div className="mt-1 space-y-1 lg:space-y-1.5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-3 w-full lg:h-3.5" />
        </div>
      </div>
    </div>
  );
}
