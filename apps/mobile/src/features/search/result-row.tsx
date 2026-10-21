import { decode } from "@infinitunes/types";
import type { SearchItem } from "@infinitunes/types";

import { MediaRow } from "~/components/media-row";

type ResultRowProps = {
  item: SearchItem;
  onPress: (item: SearchItem) => void;
};

/** A combined-search result as a tappable row. */
export function ResultRow({ item, onPress }: ResultRowProps) {
  return (
    <MediaRow
      title={decode(item.title)}
      subtitle={decode(item.subtitle ?? item.extra) || undefined}
      image={item.image}
      onPress={() => onPress(item)}
    />
  );
}
