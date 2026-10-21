import type { MediaType } from "@infinitunes/types";
import { parseToken } from "@infinitunes/types";
import type { Href } from "expo-router";

/**
 * Detail screens, shared by the Home, Search and Library stacks
 * (`app/(tabs)/(home,search,library)/<type>/[token].tsx`), so opening one
 * keeps the tab it was opened from.
 */
const ENTITY_ROUTES = {
  album: "/album/[token]",
  artist: "/artist/[token]",
  episode: "/episode/[token]",
  label: "/label/[token]",
  mix: "/mix/[token]",
  playlist: "/playlist/[token]",
  show: "/show/[token]",
  song: "/song/[token]",
} as const;

export type EntityType = keyof typeof ENTITY_ROUTES;

export function isEntityType(type: string): type is EntityType {
  return type in ENTITY_ROUTES;
}

/**
 * The screen for an upstream item, from its type and perma URL (the token is
 * the URL's last segment, what every details procedure takes). `undefined`
 * for types without a screen (radio stations, channels), so the caller
 * renders the item as not pressable.
 */
export function entityHref(type: MediaType, url: string): Href | undefined {
  const token = parseToken(url);
  if (!token || !isEntityType(type)) return undefined;
  return { pathname: ENTITY_ROUTES[type], params: { token } };
}
