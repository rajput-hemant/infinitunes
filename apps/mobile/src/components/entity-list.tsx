import type { CardItem, SongRowItem } from "@infinitunes/types";

import { entityHref } from "~/navigation/entity-href";
import { playFrom } from "~/playback/play-collection";

import { ListRow } from "./list-row";
import { SongRow } from "./song-row";

/**
 * The rows of an entity screen's one `FlashList` (artist, label, show): its
 * songs and its albums, whichever tab is active, so the list (and the header
 * above it) stays mounted while the tab changes.
 */
export type EntityListItem =
  | {
      kind: "song";
      id: string;
      row: SongRowItem;
      /** The list this row belongs to, played from `index` when pressed. */
      queue: readonly SongRowItem[];
      index: number;
    }
  | { kind: "card"; id: string; card: CardItem };

/** The first `limit` rows as list items; pressing one queues the whole `queue`. */
export function songItems(
  queue: readonly SongRowItem[],
  limit = queue.length,
): EntityListItem[] {
  return queue.slice(0, limit).map((row, index) => ({
    kind: "song",
    // A song can repeat in a list (artist, label, show): the position keeps keys unique.
    id: `${row.id}-${index}`,
    row,
    queue,
    index,
  }));
}

export function cardItems(cards: readonly CardItem[]): EntityListItem[] {
  return cards.map((card) => ({ kind: "card", id: card.id, card }));
}

/** `FlashList`'s `renderItem` for the song and card rows. */
export function renderEntityListItem({ item }: { item: EntityListItem }) {
  if (item.kind === "song") {
    return (
      <SongRow
        song={item.row}
        onPress={() => playFrom(item.queue, item.index)}
      />
    );
  }
  const { card } = item;
  const href = entityHref(card.type, card.url);
  // `ListRow` directly: iOS marks a row that opens a screen with a chevron.
  return (
    <ListRow
      title={card.name}
      subtitle={card.subtitle}
      leading={{ artwork: card.image }}
      href={href}
      entity={href ? card : undefined}
      chevron={Boolean(href)}
    />
  );
}

export function entityListKey(item: { kind: string; id: string }): string {
  return `${item.kind}-${item.id}`;
}
