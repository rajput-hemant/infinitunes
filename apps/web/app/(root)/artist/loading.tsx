import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/app/(root)/browse/_components/catalog-skeleton";

/** Mirrors Top Artists: header without a subtitle, then round artist cards. */
export default function TopArtistsLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton subtitle={false} />

      <CatalogGridSkeleton rounded />
    </div>
  );
}
