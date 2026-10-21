import { View } from "react-native";

import { ShelfSkeleton } from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { radii } from "~/theme/tokens";

/** The hero's artwork and Play button, then two shelves, at their real sizes. */
export function HomeSkeleton() {
  return (
    <>
      <SkeletonPulse>
        <View className="gap-3 px-page py-2">
          <SkeletonBlock
            style={{ width: "100%", aspectRatio: 1, borderRadius: radii.lg }}
          />
          <SkeletonBlock className="h-ctl-lg rounded-lg" />
        </View>
      </SkeletonPulse>
      <ShelfSkeleton />
      <ShelfSkeleton />
    </>
  );
}
