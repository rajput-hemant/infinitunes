import { decode } from "@infinitunes/types";
import type { SearchItem } from "@infinitunes/types";
import { Pressable, View } from "react-native";

import { isRoundType } from "~/components/media-card";
import { SectionHeader } from "~/components/section-header";
import { SectionHeaderSkeleton, SkeletonText } from "~/components/skeletons";
import { Artwork, artworkFrame } from "~/components/ui/artwork";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { usePalette } from "~/theme/use-palette";

import { resultSubtitle } from "./result-subtitle";
import { TopResultPlay } from "./top-result-play";

type TopResultCardProps = {
  item: SearchItem;
  onPress: (item: SearchItem) => void;
};

/**
 * The Top Result: a filled card with large art, the name, its kind and
 * credit, and Play at its end. The art and text open the result; Play is its
 * own button beside them, so screen readers reach both.
 */
export function TopResultCard({ item, onPress }: TopResultCardProps) {
  const palette = usePalette();
  const title = decode(item.title);
  const subtitle = resultSubtitle(item);

  return (
    <View>
      <SectionHeader title="Top Result" />
      <View className="mx-page flex-row items-center overflow-hidden rounded-lg bg-card">
        <Pressable
          onPress={() => onPress(item)}
          android_ripple={{ color: palette["fill-2"], foreground: true }}
          accessibilityRole="button"
          accessibilityLabel={[title, subtitle].filter(Boolean).join(", ")}
          className="flex-1 flex-row items-center gap-4 p-4"
        >
          <Artwork
            image={item.image}
            size="feature"
            round={isRoundType(item.type)}
          />
          <View className="flex-1 gap-1">
            <Text variant="title2" emphasized numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="subhead" tone="muted" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <View className="pr-4">
          <TopResultPlay item={item} />
        </View>
      </View>
    </View>
  );
}

/** The card while results load, at its real geometry (art, two lines, Play). */
export function TopResultCardSkeleton() {
  return (
    <>
      <SectionHeaderSkeleton />
      <SkeletonPulse>
        <View className="mx-page flex-row items-center gap-4 rounded-lg bg-card p-4">
          <SkeletonBlock style={artworkFrame("feature", 0)} />
          <View className="flex-1 gap-1">
            <SkeletonText variant="title2" width="70%" />
            <SkeletonText variant="subhead" width="50%" />
          </View>
          <SkeletonBlock className="size-row rounded-full" />
        </View>
      </SkeletonPulse>
    </>
  );
}
