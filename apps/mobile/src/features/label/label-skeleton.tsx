import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  SegmentedTabsSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";

/** The label screen while it loads: header, the Songs/Albums switch and a list. */
export function LabelSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <SegmentedTabsSkeleton />
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
