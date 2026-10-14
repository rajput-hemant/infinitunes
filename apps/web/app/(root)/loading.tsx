import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "./browse/_components/catalog-skeleton";

/**
 * The boundary above every page under the layout. A page's own `loading.tsx`
 * replaces it, but only once the router knows it (a prefetched link). Without
 * that (`next dev`, a programmatic navigation, a link that was not prefetched)
 * this stands in for any page, and the router gives no way to tell which. So it
 * is the shape most pages share, a header over a grid, rather than the shape of
 * one of them. The home page never reaches it: it is prerendered.
 */
export default function RootLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton />

      <CatalogGridSkeleton count={12} />
    </div>
  );
}
