import { decode } from "@infinitunes/types";
import { Pressable } from "react-native";

import { MediaRow } from "~/components/media-row";

import type { SearchItem } from "./search-items";

type ResultRowProps = {
  item: SearchItem;
  onPress: (item: SearchItem) => void;
};

/** A combined-search result as a tappable row. */
export function ResultRow({ item, onPress }: ResultRowProps) {
  const title = decode(item.title);
  const subtitle = decode(item.subtitle ?? item.extra) || undefined;

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      className="active:opacity-70"
    >
      <MediaRow title={title} subtitle={subtitle} image={item.image} />
    </Pressable>
  );
}
