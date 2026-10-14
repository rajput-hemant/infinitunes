import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { LibraryHeadingSkeleton } from "~/components/library/library-heading-skeleton";

/** Mirrors the library collection: heading with a count, then the card grid. */
export default function LikedAlbumsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <LibraryHeadingSkeleton />

      <CatalogGridSkeleton count={12} />
    </div>
  );
}
