import type { Episode, Queue, Song } from "@infinitunes/types";
import { decode } from "@infinitunes/types";

export function getItemName(item: Song | Episode | Queue): string {
  return "title" in item ? decode(item.title) : item.name;
}
