import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { LanguageBarSkeleton } from "~/components/skeletons/language-bar-skeleton";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";

export default function RadioLoading() {
  return (
    <div className="space-y-4">
      <LanguageBarSkeleton />

      <Skeleton className="h-8 w-44 sm:h-9 md:h-10 md:w-72" />

      <CatalogGrid>
        {Array.from({ length: 26 }).map((_, i) => (
          <SliderCardSkeleton key={i} rounded />
        ))}
      </CatalogGrid>
    </div>
  );
}
