import { Platform, View } from "react-native";

import { HERO } from "~/components/media-card";
import {
  PICK_TILE_CLASS,
  PICK_TILE_HEIGHT,
} from "~/components/quick-pick-tile";
import { useHeroWidth } from "~/components/shelf";
import {
  CardTextSkeleton,
  SectionHeaderSkeleton,
  ShelfSkeleton,
  SkeletonText,
} from "~/components/skeletons";
import { range, SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { GRID_GAP, useGrid } from "~/lib/use-grid-card-width";
import { art } from "~/theme/tokens";
import { useRadii } from "~/theme/use-radii";

import { QUICK_PICKS } from "./home-model";

/** Surprise Me and Browse, then the picks. */
const PICK_TILES = 2 + QUICK_PICKS;

/** Material's tiles sit on a tonal surface container; iOS's on a translucent fill (`QuickPickTile`). */
const MATERIAL = Platform.OS === "android";

/** The featured carousel, the quick picks grid and a shelf, at their real sizes. */
export function HomeSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <SectionHeaderSkeleton />
      <QuickPicksSkeleton />
      <ShelfSkeleton />
    </>
  );
}

/** The hero carousel: one large card and the peek of the next, with its eyebrow and title (and iOS's subtitle). */
function HeroSkeleton() {
  const width = useHeroWidth();
  const scale = useRadii();
  const frame = { width, height: width, borderRadius: scale[HERO.radius] };
  return (
    <SkeletonPulse>
      <View className="flex-row gap-3 overflow-hidden px-page">
        {range(2).map((card) => (
          <View key={card} className="gap-2" style={{ width }}>
            <SkeletonBlock style={frame} />
            <View>
              <SkeletonText variant="caption" width="40%" />
              {HERO.subtitle ? (
                <CardTextSkeleton hero />
              ) : (
                <SkeletonText variant="headline" width="80%" />
              )}
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}

/** Quick-pick tiles as `QuickPickTile` draws them: the tile surface, the art and a title line. */
function QuickPicksSkeleton() {
  const { width } = useGrid("picks");
  const scale = useRadii();
  return (
    <SkeletonPulse>
      <View className="flex-row flex-wrap px-page" style={{ gap: GRID_GAP }}>
        {range(PICK_TILES).map((tile) => (
          <View
            key={tile}
            className={PICK_TILE_CLASS}
            style={{ width, minHeight: PICK_TILE_HEIGHT }}
          >
            {/* Android's art is inset at `sm`; iOS's is flush, clipped by the tile. */}
            <SkeletonBlock
              style={{
                width: art.pick,
                height: art.pick,
                borderRadius: MATERIAL ? scale.sm : 0,
              }}
            />
            <SkeletonText
              variant={MATERIAL ? "label" : "footnote"}
              width="55%"
            />
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}
