import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/components/catalog/catalog-skeleton";

/**
 * The boundary above every page under the layout. A page's own `loading.tsx`
 * replaces it, so it only shows for a page without one. The home page is
 * prerendered and never loads, so it does not get one; this is the shape most
 * pages share, a header over a grid.
 */
export default function RootLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton />

      <CatalogGridSkeleton count={12} />
    </div>
  );
}
