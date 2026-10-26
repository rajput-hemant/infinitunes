import { View } from "react-native";

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
      <View className="gap-2 pb-2">
        <EntityHeaderSkeleton
          round
          download={false}
          subtitle={false}
          meta={false}
        />
        <SegmentedTabsSkeleton />
      </View>
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
