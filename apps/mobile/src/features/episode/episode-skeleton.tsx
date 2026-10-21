import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  TextBlockSkeleton,
} from "~/components/skeletons";

/** The episode screen while it loads: header and the description lines. */
export function EpisodeSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton shuffle={false} />
      <TextBlockSkeleton />
    </ScreenScrollView>
  );
}
