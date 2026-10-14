import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";

export default function TopPodcastsLoading() {
  return (
    <div className="space-y-4">
      <div className="mt-4 space-y-1">
        <Skeleton className="h-7 w-44 sm:h-8 md:h-9 md:w-72" />
        <Skeleton className="h-6 w-32 sm:h-6 md:h-6 md:w-56" />
      </div>

      <Shelf rows={2}>
        {Array.from({ length: 26 }).map((_, i) => (
          <ShelfItem key={i}>
            <SliderCardSkeleton hideSubtitle />
          </ShelfItem>
        ))}
      </Shelf>

      <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />

      <CatalogGrid>
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} hideSubtitle />
        ))}
      </CatalogGrid>
    </div>
  );
}
