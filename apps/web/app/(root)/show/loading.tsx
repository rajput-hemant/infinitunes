import { Skeleton } from "@infinitunes/ui/components/skeleton";

import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/app/(root)/browse/_components/catalog-skeleton";
import { ShelfSkeleton } from "~/components/slider/shelf-skeleton";

/** Mirrors Podcasts: header, a two-row trending shelf, then the full grid. */
export default function TopPodcastsLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton />

      <Skeleton className="mb-3 h-7 w-52" />

      <ShelfSkeleton rows={2} count={8} />

      <Skeleton className="mt-8 mb-3 h-7 w-40" />

      <CatalogGridSkeleton />
    </div>
  );
}
