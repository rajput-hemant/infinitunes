import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { EntityHeaderSkeleton } from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";

/** The episode screen while it loads: header and the description lines. */
export function EpisodeSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <SkeletonPulse>
        <View className="gap-2 px-page">
          <SkeletonBlock className="h-5 w-2/5 rounded-sm" />
          <SkeletonBlock className="h-3.5 w-full rounded-sm" />
          <SkeletonBlock className="h-3.5 w-4/5 rounded-sm" />
        </View>
      </SkeletonPulse>
    </ScreenScrollView>
  );
}
