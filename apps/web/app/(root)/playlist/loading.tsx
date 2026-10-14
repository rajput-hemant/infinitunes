import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "~/app/(root)/browse/_components/catalog-skeleton";

/** Mirrors Top Playlists: header without a subtitle, then the playlist grid. */
export default function FeaturedPlaylistsLoading() {
  return (
    <div aria-busy="true">
      <CatalogHeaderSkeleton subtitle={false} />

      <CatalogGridSkeleton />
    </div>
  );
}
