import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { SongListSkeleton } from "@/components/skeletons/song-list-skeleton";

export default function RadioStationLoading() {
  return (
    <div className="space-y-4">
      <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <Skeleton className="aspect-square w-44 rounded-full md:w-56 xl:w-64" />

        <div className="flex w-full flex-col items-center gap-2 lg:items-start">
          <Skeleton className="h-8 w-64 sm:h-9 md:h-10" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-4 h-10 w-32 rounded-full lg:mt-6" />
        </div>
      </div>

      <SongListSkeleton />
    </div>
  );
}
