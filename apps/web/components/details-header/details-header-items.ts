import type {
  Album,
  Artist,
  Episode,
  Label,
  Mix,
  Playlist,
  ShowDetails,
  Song,
} from "@infinitunes/types";
import { decode, isExplicit } from "@infinitunes/types";

export type DetailsItem =
  | Album
  | Song
  | Playlist
  | Artist
  | Episode
  | ShowDetails
  | Label
  | Mix;

/** Every item except `Label`, which has no raw `type` literal. */
export type TypedDetailsItem = Exclude<DetailsItem, Label>;

export type DetailsKind = TypedDetailsItem["type"] | "label";

/** `Label` is the only variant without a `type` field; it is identified by `labelId`. */
export function isLabel(item: DetailsItem): item is Label {
  return "labelId" in item;
}

export function isKind<K extends TypedDetailsItem["type"]>(
  item: DetailsItem,
  kind: K,
): item is Extract<TypedDetailsItem, { type: K }> {
  return "type" in item && item.type === kind;
}

/** A show page's header item (live upstream types it `"show"`; older fixtures said `"season"`). */
export function isShowDetails(item: DetailsItem): item is ShowDetails {
  return (
    !isLabel(item) && (item.type === "show" || String(item.type) === "season")
  );
}

export function getKind(item: DetailsItem): DetailsKind {
  return isLabel(item) ? "label" : item.type;
}

export function getId(item: DetailsItem): string {
  if (isLabel(item)) return item.labelId;
  if (item.type === "artist") return item.artistId;
  return item.id;
}

export function getTitle(item: DetailsItem): string {
  return decode("title" in item ? item.title : item.name);
}

export function getSubtitle(item: DetailsItem): string {
  return decode("subtitle" in item ? item.subtitle : "");
}

/** A single song or episode has nothing to shuffle; every other page lists tracks. */
export function canShuffle(item: DetailsItem): boolean {
  return !isKind(item, "song") && !isKind(item, "episode");
}

/**
 * A playlist's meta parts: the subtitle, then `subtitle_desc` reversed. Upstream
 * repeats the fan count (compact "159.5K Fans" and exact "159,534 Fans"), so only
 * the first one, the subtitle's compact form, is kept.
 */
export function playlistMetaParts(playlist: Playlist): string[] {
  const parts = [
    decode(playlist.subtitle),
    ...playlist.more_info.subtitle_desc.slice().reverse().map(decode),
  ].filter(Boolean);

  let hasFans = false;
  return parts.filter((part) => {
    if (!/\bFans$/.test(part)) return true;
    if (hasFans) return false;
    hasFans = true;
    return true;
  });
}

export function getVerified(item: DetailsItem): boolean {
  return "isVerified" in item ? item.isVerified : false;
}

export function getExplicit(item: DetailsItem): boolean {
  return "explicit_content" in item && isExplicit(item.explicit_content);
}

/** The tracks a page lists. A song page lists itself. */
export function getSongs(item: DetailsItem): Song[] {
  if (isKind(item, "song")) return [item];
  const list = "list" in item ? item.list : undefined;
  return Array.isArray(list) ? list : [];
}
