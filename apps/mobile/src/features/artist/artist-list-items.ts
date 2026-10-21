import type {
  ArtistBioSection,
  CardItem,
  SongRowItem,
} from "@infinitunes/types";

/**
 * What the artist screen's one list renders, whichever tab is active: the
 * list (and so the header above it) stays mounted while the tab changes.
 */
export type ArtistListItem =
  | {
      kind: "song";
      id: string;
      row: SongRowItem;
      /** The list this row belongs to, played from `index` when pressed. */
      queue: readonly SongRowItem[];
      index: number;
    }
  | { kind: "album"; id: string; card: CardItem }
  | { kind: "bio"; id: string; section: ArtistBioSection };

/** The first `limit` rows as list items; pressing one queues the whole `queue`. */
export function songItems(
  queue: readonly SongRowItem[],
  limit = queue.length,
): ArtistListItem[] {
  return queue
    .slice(0, limit)
    .map((row, index) => ({ kind: "song", id: row.id, row, queue, index }));
}

export function albumItems(cards: readonly CardItem[]): ArtistListItem[] {
  return cards.map((card) => ({ kind: "album", id: card.id, card }));
}

export function bioItems(
  sections: readonly ArtistBioSection[],
): ArtistListItem[] {
  return sections.map((section, index) => ({
    kind: "bio",
    id: `${index}-${section.title}`,
    section,
  }));
}
