import { decode } from "@infinitunes/types";
import type { SearchItem } from "@infinitunes/types";

import { isRoundType } from "~/components/media-card";
import { MediaRow } from "~/components/media-row";

import { resultSubtitle } from "./result-subtitle";

type ResultRowProps = {
  item: SearchItem;
  onPress: (item: SearchItem) => void;
};

/** A combined-search result as a tappable row. */
export function ResultRow({ item, onPress }: ResultRowProps) {
  return (
    <MediaRow
      title={decode(item.title)}
      subtitle={resultSubtitle(item)}
      image={item.image}
      round={isRoundType(item.type)}
      onPress={() => onPress(item)}
    />
  );
}
