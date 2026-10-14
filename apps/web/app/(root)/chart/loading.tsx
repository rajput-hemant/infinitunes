import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/app/(root)/browse/_components/catalog-skeleton";

/** Mirrors Top Charts: header, then 16:9 chart cards. */
export default function TopChartsLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton />

      <CatalogGridSkeleton aspect="video" />
    </div>
  );
}
