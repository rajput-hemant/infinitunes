import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";

export default function TopArtistsPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="mt-4 h-8 w-72 sm:h-9 md:h-10" />

      <CatalogGrid>
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} rounded />
        ))}
      </CatalogGrid>
    </div>
  );
}
