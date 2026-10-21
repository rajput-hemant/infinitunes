import { View } from "react-native";

import { radii, sizes } from "~/theme/tokens";

import { ENTITY_ART_SIZE } from "./entity-header";
import { MEDIA_CARD_WIDTH } from "./media-card";
import { SkeletonBlock, SkeletonPulse } from "./ui/skeleton";

/**
 * Loading placeholders that mirror the real layouts (`SongRow`, `Shelf`,
 * `EntityHeader`) at their real sizes, so content lands without a jump.
 */

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

function SongRowSkeleton() {
  return (
    <View className="h-row flex-row items-center gap-3 px-page">
      <SkeletonBlock
        style={{ width: sizes.art, height: sizes.art, borderRadius: radii.sm }}
      />
      <View className="flex-1 gap-2">
        <SkeletonBlock className="h-3.5 w-3/5 rounded-sm" />
        <SkeletonBlock className="h-3 w-2/5 rounded-sm" />
      </View>
    </View>
  );
}

export function SongListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonPulse>
      {range(rows).map((row) => (
        <SongRowSkeleton key={row} />
      ))}
    </SkeletonPulse>
  );
}

export function ShelfSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <SkeletonPulse>
      <View className="gap-2 py-3">
        <SkeletonBlock className="mx-page h-5 w-2/5 rounded-sm" />
        <View className="flex-row gap-3 overflow-hidden px-page">
          {range(cards).map((card) => (
            <View key={card} className="gap-1.5">
              <SkeletonBlock
                style={{
                  width: MEDIA_CARD_WIDTH,
                  height: MEDIA_CARD_WIDTH,
                  borderRadius: radii.md,
                }}
              />
              <SkeletonBlock className="h-3 w-4/5 rounded-sm" />
            </View>
          ))}
        </View>
      </View>
    </SkeletonPulse>
  );
}

export function EntityHeaderSkeleton() {
  return (
    <SkeletonPulse>
      <View className="items-center gap-4 px-page pb-4 pt-2">
        <SkeletonBlock
          style={{
            width: ENTITY_ART_SIZE,
            height: ENTITY_ART_SIZE,
            borderRadius: radii.lg,
          }}
        />
        <SkeletonBlock className="h-6 w-3/5 rounded-sm" />
        <SkeletonBlock className="h-4 w-2/5 rounded-sm" />
        <View className="w-full flex-row gap-3">
          <SkeletonBlock className="h-ctl-lg flex-1 rounded-lg" />
          <SkeletonBlock className="h-ctl-lg flex-1 rounded-lg" />
        </View>
      </View>
    </SkeletonPulse>
  );
}
