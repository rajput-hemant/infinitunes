import type { MediaType } from "@infinitunes/types";

const PLACEHOLDERS = {
  artist: "artist",
  album: "album",
  playlist: "playlist",
  radio: "radio",
  radio_station: "radio",
  song: "song",
  channel: "radio",
  mix: "playlist",
  show: "show",
  season: "show",
  episode: "song",
  label: "artist",
} as const satisfies Record<MediaType, string>;

/** Fallback artwork for a media type; only a handful of placeholder images ship in `public/images/placeholder`. */
export function getPlaceholderSrc(type: MediaType) {
  return `/images/placeholder/${PLACEHOLDERS[type]}.jpg`;
}
