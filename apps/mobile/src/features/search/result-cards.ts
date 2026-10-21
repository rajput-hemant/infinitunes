import type { CardItem, SearchReturnType, Song } from "@infinitunes/types";
import { decode, toCardItem } from "@infinitunes/types";

/** One result of `search.byType`, whichever list it came from. */
export type SearchEntry = SearchReturnType["results"][number];

export type CardEntry = Exclude<SearchEntry, Song>;

export function isSongEntry(entry: SearchEntry): entry is Song {
  return entry.type === "song";
}

/**
 * Artists are named `name` and described by `role`; podcasts carry their
 * artwork as `image_file_url` and a numeric `explicit_content`. Albums and
 * playlists already match `toCardItem`.
 */
export function toResultCard(entry: CardEntry): CardItem {
  if ("name" in entry) {
    return {
      id: entry.id,
      name: decode(entry.name),
      url: entry.perma_url,
      subtitle: entry.role ? decode(entry.role) : undefined,
      type: entry.type,
      image: entry.image,
    };
  }
  if ("image_file_url" in entry) {
    return {
      id: entry.id,
      name: decode(entry.title),
      url: entry.perma_url,
      subtitle: entry.subtitle ? decode(entry.subtitle) : undefined,
      type: entry.type,
      image: entry.image_file_url,
    };
  }
  return toCardItem(entry);
}
