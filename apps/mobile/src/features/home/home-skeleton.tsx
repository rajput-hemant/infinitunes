import { View } from "react-native";

import { SectionHeaderSkeleton, ShelfSkeleton } from "~/components/skeletons";
import { range, SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { art } from "~/theme/tokens";

const PICK_TILES = 4;

/** The featured carousel, the quick picks grid and a shelf, at their real sizes. */
export function HomeSkeleton() {
  const width = useGridCardWidth();

  return (
    <>
      <ShelfSkeleton variant="hero" cards={2} />
      <SectionHeaderSkeleton />
      <SkeletonPulse>
        <View className="flex-row flex-wrap px-page" style={{ gap: GRID_GAP }}>
          {range(PICK_TILES).map((tile) => (
            <SkeletonBlock
              key={tile}
              className="rounded-md"
              style={{ width, height: art.pick }}
            />
          ))}
        </View>
      </SkeletonPulse>
      <ShelfSkeleton />
    </>
  );
}
