import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { SliderCardSkeleton } from "~/components/slider/slider-card-skeleton";
import type { SliderCardSkeletonProps } from "~/components/slider/slider-card-skeleton";

import { CatalogGrid } from "./catalog-grid";
import { catalogHeaderClassName } from "./catalog-header";

type CatalogHeaderSkeletonProps = {
  subtitle?: boolean;
};

/** Mirrors `CatalogHeader`: a 32px (40px from md) title line and an optional 20px subtitle. */
export function CatalogHeaderSkeleton({
  subtitle = true,
}: CatalogHeaderSkeletonProps) {
  return (
    <header className={catalogHeaderClassName}>
      <Skeleton className="h-8 w-44 md:h-10 md:w-60" />

      {subtitle && (
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-56 max-w-full" />
        </div>
      )}
    </header>
  );
}

type CatalogGridSkeletonProps = SliderCardSkeletonProps & {
  count?: number;
};

/** The catalog grid with placeholder cards: same columns, gaps and breakpoints. */
export function CatalogGridSkeleton(props: CatalogGridSkeletonProps) {
  const { count = 24, ...card } = props;

  return (
    <CatalogGrid>
      {Array.from({ length: count }).map((_, i) => (
        <SliderCardSkeleton key={i} {...card} />
      ))}
    </CatalogGrid>
  );
}

const CATEGORY_TILE_COUNT = 8;

/** The Browse category tiles (`h-24`), same grid as the real ones. */
export function CategoryTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
      {Array.from({ length: CATEGORY_TILE_COUNT }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-md" />
      ))}
    </div>
  );
}
