import type { MediaType } from "@infinitunes/types";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { cx } from "~/lib/class-names";
import { art } from "~/theme/tokens";

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
  item?: { type: MediaType; url: string };
};

const TILE_CLASS =
  "flex-row items-center gap-3 overflow-hidden rounded-md bg-fill pr-3";

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
  const entries = useCardMenuEntries(item);
  const style = { width, minHeight: art.pick };
  // A tile without a screen dims only its picture, so the title keeps its contrast.
  const dimmed = !href && !onPress;
  const content = (
    <>
      {"artwork" in leading ? (
        <View className={dimmed ? "opacity-50" : undefined}>
          <Artwork
            image={leading.artwork}
            size="pick"
            style={{ borderRadius: 0 }}
          />
        </View>
      ) : (
        <View
          className={cx(
            "items-center justify-center self-stretch bg-fill-2",
            dimmed && "opacity-50",
          )}
          style={{ width: art.pick }}
        >
          <Icon name={leading.icon} size="md" />
        </View>
      )}
      <Text variant="subhead" numberOfLines={2} className="flex-1">
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
        className={TILE_CLASS}
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
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...cardAccessibilityActions(entries)}
      className={`${TILE_CLASS} active:opacity-70`}
      style={style}
    >
      {content}
    </Pressable>
  );

  // An action tile (Surprise me) has no item, so no menu.
  if (!href) return pressable();
  return (
    <CardLink href={href} name={title} entries={entries}>
      {pressable}
    </CardLink>
  );
}
