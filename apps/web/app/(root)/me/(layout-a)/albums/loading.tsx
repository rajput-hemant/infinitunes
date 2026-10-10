import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";

export default function LikedAlbumsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72 sm:h-9" />

      <CatalogGrid>
        {Array.from({ length: 12 }).map((_, i) => (
          <SliderCardSkeleton key={i} />
        ))}
      </CatalogGrid>
    </div>
  );
}
