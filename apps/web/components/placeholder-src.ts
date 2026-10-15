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

/**
 * JioSaavn's own "no artwork" images (`/_i/3.0/artist-default-film.png`). The
 * CDN answers them with a document the browser's ORB blocks, so they never
 * render; the app's own placeholder stands in without requesting them.
 */
export function isUpstreamPlaceholder(src: unknown): boolean {
  return (
    typeof src === "string" && /\/_i\/3\.0\/[\w-]*default[\w-]*\.png/i.test(src)
  );
}
