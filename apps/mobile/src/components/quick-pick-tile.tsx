import type { MediaType } from "@infinitunes/types";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, View } from "react-native";

import { art } from "~/theme/tokens";

import {
  CardMenu,
  cardAccessibilityActions,
  cardMenuEntries,
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
  /** The catalog item behind the tile: its long press offers Play, Play Next and Add to Queue. */
  item?: { type: MediaType; url: string };
};

const TILE_CLASS =
  "flex-row items-center gap-3 overflow-hidden rounded-md bg-fill pe-3";

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
  item,
}: QuickPickTileProps) {
  const entries = item ? cardMenuEntries({ ...item, name: title }) : [];
  const style = { width, minHeight: art.pick };
  const content = (
    <>
      {"artwork" in leading ? (
        <Artwork
          image={leading.artwork}
          size="pick"
          style={{ borderRadius: 0 }}
        />
      ) : (
        <View
          className="items-center justify-center self-stretch bg-fill-2"
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
  if (!href && !onPress) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        className={`${TILE_CLASS} opacity-50`}
        style={style}
      >
        {content}
      </View>
    );
  }

  const pressable = (
    <Pressable
      onPress={onPress}
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={accessibilityLabel}
      {...cardAccessibilityActions(entries)}
      className={`${TILE_CLASS} active:opacity-70`}
      style={style}
    >
      {content}
    </Pressable>
  );
  return (
    <CardMenu name={title} entries={entries}>
      {href ? (
        <Link href={href} asChild>
          {pressable}
        </Link>
      ) : (
        pressable
      )}
    </CardMenu>
  );
}
