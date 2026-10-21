import type { CardItem } from "@infinitunes/types";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { CardPlayButton } from "~/components/card-play-button";
import { Artwork } from "~/components/ui/artwork";
import { Text } from "~/components/ui/text";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { entityHref } from "~/navigation/entity-href";
import { isPlayable } from "~/playback/play-entity";
import { radii, sizes } from "~/theme/tokens";

const ART_SIZE = 56;
/** The play button's inset from the tile's right edge, centred vertically. */
const PLAY_INSET = (ART_SIZE - sizes.touch) / 2;

/** A compact tile that opens the item, with a Play button at its end (as on the web). */
function QuickPick({ item, width }: { item: CardItem; width: number }) {
  const href = entityHref(item.type, item.url);
  const playType =
    href !== undefined && isPlayable(item.type) ? item.type : undefined;
  const content = (
    <>
      <Artwork
        image={item.image}
        quality="medium"
        style={{ width: ART_SIZE, height: ART_SIZE }}
      />
      <Text
        variant="subhead"
        numberOfLines={2}
        className="flex-1"
        style={{ paddingEnd: playType ? sizes.touch + PLAY_INSET * 2 : 8 }}
      >
        {item.name}
      </Text>
    </>
  );
  const tileClass =
    "min-h-row flex-row items-center gap-2 overflow-hidden bg-fill";

  if (!href) {
    return (
      <View
        accessible
        accessibilityLabel={item.name}
        className={tileClass}
        style={{ width, borderRadius: radii.md }}
      >
        {content}
      </View>
    );
  }
  const linked = (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={item.name}
        className={`${tileClass} active:opacity-70`}
        style={{ width, borderRadius: radii.md }}
      >
        {content}
      </Pressable>
    </Link>
  );
  if (!playType) return linked;
  return (
    <View style={{ width }}>
      {linked}
      <CardPlayButton
        type={playType}
        url={item.url}
        name={item.name}
        style={{ position: "absolute", top: PLAY_INSET, end: PLAY_INSET }}
      />
    </View>
  );
}

/** New albums and playlists as compact tiles, to jump straight in. */
export function QuickPicks({ items }: { items: readonly CardItem[] }) {
  const width = useGridCardWidth();
  if (items.length === 0) return null;

  return (
    <View className="gap-3 px-page py-3">
      <Text variant="title" accessibilityRole="header">
        Quick picks
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
        {items.map((item) => (
          <QuickPick
            key={`${item.type}-${item.id}`}
            item={item}
            width={width}
          />
        ))}
      </View>
    </View>
  );
}
