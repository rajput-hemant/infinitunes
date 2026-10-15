import type { Episode, Queue, Song } from "@infinitunes/types";
import type { LucideIcon } from "lucide-react";

import { getHref } from "~/lib/utils";

export type TileMoreItem = Song | Episode | Queue;

export type TileMoreEntry = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

export function getItemUrl(item: TileMoreItem): string {
  return "perma_url" in item ? item.perma_url : item.url;
}

/** The item's own page, so a row's Share never falls back to the page it sits on. */
export function getItemSharePath(item: TileMoreItem): string {
  return getHref(getItemUrl(item), item.type);
}

export function getItemAlbumUrl(item: TileMoreItem): string | undefined {
  return "more_info" in item && item.type === "song"
    ? item.more_info.album_url
    : undefined;
}

export function getItemArtists(item: TileMoreItem) {
  return "more_info" in item
    ? (item.more_info.artistMap?.primary_artists ?? [])
    : item.artists;
}

export function getEntryLabel(item: TileMoreItem, label: string): string {
  return item.type === "song" ? label : label.replace("Song", "Episode");
}
