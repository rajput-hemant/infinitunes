import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  SegmentedTabsSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";

/** The artist screen while its payload loads: header, tab row, top songs and a shelf. */
export function ArtistSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton round />
      <SegmentedTabsSkeleton />
      <SongListSkeleton rows={5} />
      <ShelfSkeleton />
    </ScreenScrollView>
  );
}
