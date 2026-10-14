import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/app/(root)/browse/_components/catalog-skeleton";
import { LanguageBarSkeleton } from "~/components/language-bar-skeleton";

/** Mirrors Top Albums: language chips, header, then the album grid. */
export default function TopAlbumsLoading() {
  return (
    <div aria-busy="true">
      <LanguageBarSkeleton />

      <CatalogHeaderSkeleton />

      <CatalogGridSkeleton />
    </div>
  );
}
