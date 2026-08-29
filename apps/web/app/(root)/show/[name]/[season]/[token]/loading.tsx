import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function ShowDetailsLoading() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="show" />

      <Skeleton className="h-7 w-44 sm:h-8 md:h-9 md:w-72" />

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SliderCardSkeleton key={i} aspect="video" hideSubtitle />
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44 sm:h-8 md:h-9 md:w-72" />
        <Skeleton className="h-9 w-28 md:w-36" />
      </div>

      <SongListSkeleton length={10} />
    </div>
  );
}
