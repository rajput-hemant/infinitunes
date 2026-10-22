import { decode } from "@infinitunes/types";
import type { MediaType, SearchItem } from "@infinitunes/types";
import { Platform } from "react-native";

const KIND_LABELS: Record<MediaType, string> = {
  artist: "Artist",
  album: "Album",
  playlist: "Playlist",
  radio: "Radio station",
  radio_station: "Radio station",
  song: "Song",
  channel: "Channel",
  mix: "Mix",
  show: "Podcast",
  episode: "Episode",
  season: "Season",
  label: "Label",
};

/** The kind of an entry in words: upstream sends the raw type ("song", "show"). */
export function kindLabel(type: MediaType): string {
  return KIND_LABELS[type];
}

/**
 * A search result's supporting line on Android: its kind and its credit
 * ("Song · Arijit Singh"), or an artist's own role ("Singer"). Upstream's song
 * `subtitle` is the album, which often repeats the title. iOS keeps the raw
 * line (`rawSubtitle`). Read at render, so a test can switch platforms.
 */
export function resultSubtitle(item: SearchItem): string | undefined {
  if (Platform.OS !== "android") return rawSubtitle(item);
  if (item.type === "artist") return decode(item.description || "Artist");
  const info = item.more_info;
  const credit = info?.singers || info?.primary_artists || info?.music;
  return [kindLabel(item.type), credit && decode(credit)]
    .filter(Boolean)
    .join(" · ");
}

function rawSubtitle(item: SearchItem): string | undefined {
  return (
    decode(item.subtitle || item.description || item.extra || "") || undefined
  );
}
