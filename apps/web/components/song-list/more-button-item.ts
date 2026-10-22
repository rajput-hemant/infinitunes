import type { QueueSource, RowExtras, SongRowItem } from "@infinitunes/types";
import type { LucideIcon } from "lucide-react";

import { getHref } from "~/lib/utils";

/** A song row or a queue entry (the player's menu): the fields every menu needs. */
export type TileMoreItem = QueueSource &
  RowExtras & {
    /** Set when the item is itself a queue entry (the player's menu), so a duplicate stays distinct. */
    queueItemId?: string;
  };

/** True for a catalog row (it has credits and links), false for the player's queue entry. */
export function isRowItem(item: TileMoreItem): item is SongRowItem {
  return item.primaryArtists !== undefined;
}

export type TileMoreEntry = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Stays listed but cannot be chosen (and reads as busy), e.g. a download in progress. */
  disabled?: boolean;
};

export function getItemUrl(item: TileMoreItem): string {
  return item.url;
}

/** The item's own page, so a row's Share never falls back to the page it sits on. */
export function getItemSharePath(item: TileMoreItem): string {
  return getHref(getItemUrl(item), item.type);
}

export function getItemAlbumUrl(item: TileMoreItem): string | undefined {
  return item.type === "song" ? item.albumUrl : undefined;
}

export function getItemArtists(item: TileMoreItem) {
  return item.primaryArtists ?? item.artists;
}

export function getEntryLabel(item: TileMoreItem, label: string): string {
  return item.type === "song" ? label : label.replace("Song", "Episode");
}
