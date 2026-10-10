import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";
import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";

export default function ShowDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeaderSkeleton type="show" />

      <Skeleton className="h-7 w-44 sm:h-8 md:h-9 md:w-72" />

      <Shelf>
        {Array.from({ length: 5 }).map((_, i) => (
          <ShelfItem key={i}>
            <SliderCardSkeleton aspect="video" hideSubtitle />
          </ShelfItem>
        ))}
      </Shelf>

      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44 sm:h-8 md:h-9 md:w-72" />
        <Skeleton className="h-9 w-28 md:w-36" />
      </div>

      <SongListSkeleton length={10} />
    </div>
  );
}
