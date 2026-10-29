import type { CardItem } from "@infinitunes/types";
import type { Href } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { cx } from "~/lib/class-names";
import { prefetchEntity } from "~/lib/entity-queries";
import { usePressScale } from "~/lib/use-press-scale";
import { art, sizes } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import {
  CardLink,
  cardAccessibilityActions,
  useCardMenuEntries,
} from "./card-menu";
import { Artwork } from "./ui/artwork";
import { Icon } from "./ui/icon";
import type { SymbolName } from "./ui/icon";
import { Text } from "./ui/text";

type QuickPickTileProps = {
  width: number;
  title: string;
  /** The item's screen: the tile is a link. */
  href?: Href;
  /** What a tap does when the tile is not a link (Surprise me). */
  onPress?: () => void;
  /** Cover art flush at the start, or an icon in its place (an action tile). */
  leading: { artwork: string } | { icon: SymbolName };
  accessibilityLabel?: string;
  /** What a tap does, when the title does not say it (Surprise me). */
  accessibilityHint?: string;
  /** The catalog item behind the tile: its long press offers Play, Play Next and Add to Queue. */
  item?: CardItem;
};

/**
 * Android: an ink tile, a hairline `outlineVariant` outline on the page (no
 * tonal box), 56dp with the 48dp art inset 4dp at `sm` corners, concentric
 * with the tile's `md`. iOS: a 48pt tile on a translucent fill with the art
 * flush at its start, clipped by the tile. Read per call so tests can switch
 * the platform. `QuickPicksSkeleton` draws the same box.
 */
export function pickTileClass() {
  return cx(
    "flex-row items-center gap-3 overflow-hidden rounded-md pr-2",
    Platform.OS === "android" ? "border border-border pl-1" : "bg-fill",
  );
}
export const PICK_TILE_HEIGHT =
  Platform.OS === "android" ? sizes.row : art.pick;

/**
 * A compact two-column tile (home's quick picks, browse): art or an icon at
 * the start, a two-line title. It opens its item; it has no Play button.
 */
export function QuickPickTile({
  width,
  title,
  href,
  onPress,
  leading,
  accessibilityLabel = title,
  accessibilityHint,
  item,
}: QuickPickTileProps) {
  const material = Platform.OS === "android";
  const entries = useCardMenuEntries(item);
  const press = usePressScale(0.97);
  const ripple = usePalette()["fill-2"];
  const style = { width, minHeight: PICK_TILE_HEIGHT };
  // A tile without a screen dims only its picture, so the title keeps its contrast.
  const dimmed = !href && !onPress;
  const content = (
    <>
      {"artwork" in leading ? (
        <View className={dimmed ? "opacity-50" : undefined}>
          <Artwork
            image={leading.artwork}
            size="pick"
            style={material ? undefined : { borderRadius: 0 }}
          />
        </View>
      ) : (
        // The art's place: a fill over the tile's own surface, so it tints
        // with the tile instead of reading as a darker block.
        <View
          testID="pick-icon-cell"
          className={cx(
            "items-center justify-center bg-fill-2",
            material ? "rounded-sm" : "self-stretch",
            dimmed && "opacity-50",
          )}
          style={{ width: art.pick, minHeight: art.pick }}
        >
          <Icon name={leading.icon} size="md" />
        </View>
      )}
      <Text
        variant={material ? "label" : "footnote"}
        numberOfLines={2}
        className="flex-1"
        style={material ? undefined : { fontWeight: "600" }}
      >
        {title}
      </Text>
    </>
  );

  // An item without a screen or an action is a labelled view, never a disabled button.
  if (dimmed) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        className={pickTileClass()}
        style={style}
      >
        {content}
      </View>
    );
  }

  const pressable = (onLongPress?: () => void) => (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.onPressIn();
        if (item) prefetchEntity(item.type, item.url);
      }}
      onPressOut={press.onPressOut}
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...cardAccessibilityActions(entries)}
      // Android: a bounded ripple, clipped by the tile's own corners.
      android_ripple={{ color: ripple, foreground: true }}
      className={pickTileClass()}
      style={style}
    >
      {content}
    </Pressable>
  );

  // iOS's link menu wraps the tile in a full-width host: the view keeps the column.
  return (
    <Animated.View style={[{ width }, press.style]}>
      {href ? (
        <CardLink href={href} name={title} entries={entries} item={item}>
          {pressable}
        </CardLink>
      ) : (
        pressable()
      )}
    </Animated.View>
  );
}
