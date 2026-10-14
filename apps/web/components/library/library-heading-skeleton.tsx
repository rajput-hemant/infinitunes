import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type LibraryHeadingSkeletonProps = {
  /** The "N songs" line under the title. */
  count?: boolean;
};

/** Mirrors `LibraryHeading`: a 28px (32px from sm) title line and a 20px count line. */
export function LibraryHeadingSkeleton({
  count = true,
}: LibraryHeadingSkeletonProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <Skeleton className="h-7 w-44 sm:h-8 sm:w-52" />

        {count && (
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-20" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Mirrors the filter, sort and Play All toolbar of `LibrarySongList`. */
export function LibraryToolbarSkeleton() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Skeleton className={cn(controlStyles.textLg, "w-full sm:max-w-xs")} />

      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-7" />
        <Skeleton className={cn(controlStyles.textLg, "w-36")} />
      </div>

      <Skeleton className={cn(controlStyles.textLg, "w-28 sm:ml-auto")} />
    </div>
  );
}
