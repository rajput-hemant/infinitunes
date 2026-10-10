import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";

import { SliderCardSkeleton } from "./slider-card-skeleton";

/** Same grid as the catalog grid, so the skeleton lands on the same cells. */
export function AlbumGridSkeleton() {
  return (
    <CatalogGrid>
      {Array.from({ length: 20 }).map((_, i) => (
        <SliderCardSkeleton key={i} />
      ))}
    </CatalogGrid>
  );
}
