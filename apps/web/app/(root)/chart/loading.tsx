import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";

export default function TopChartsLoading() {
  return (
    <div>
      <header className="space-y-1 pt-2 pb-6">
        <Skeleton className="h-8 w-72 md:h-10" />
      </header>

      <CatalogGrid>
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} aspect="video" />
        ))}
      </CatalogGrid>
    </div>
  );
}
