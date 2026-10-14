import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/app/(root)/browse/_components/catalog-skeleton";

/** Mirrors Radio: header, then round station cards. */
export default function RadioLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton />

      <CatalogGridSkeleton rounded />
    </div>
  );
}
