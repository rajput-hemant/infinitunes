import type { CardItem } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { Text } from "~/components/ui/text";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { entityHref } from "~/navigation/entity-href";
import { radii } from "~/theme/tokens";

const ART_SIZE = 56;

function QuickPick({ item, width }: { item: CardItem; width: number }) {
  const href = entityHref(item.type, item.url);
  const pick = (
    <Pressable
      disabled={!href}
      accessibilityRole={href ? "link" : undefined}
      accessibilityLabel={item.name}
      className="flex-row items-center gap-2 overflow-hidden bg-fill active:opacity-70"
      style={{ width, borderRadius: radii.md }}
    >
      <Image
        source={getImageSrc(item.image, "medium")}
        style={{ width: ART_SIZE, height: ART_SIZE }}
        accessibilityIgnoresInvertColors
      />
      <Text variant="subhead" numberOfLines={2} className="flex-1 pr-2">
        {item.name}
      </Text>
    </Pressable>
  );

  return href ? (
    <Link href={href} asChild>
      {pick}
    </Link>
  ) : (
    pick
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
