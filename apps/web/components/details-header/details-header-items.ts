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
import { decode } from "@infinitunes/types";

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

export function getVerified(item: DetailsItem): boolean {
  return "isVerified" in item ? item.isVerified : false;
}

export function getExplicit(item: DetailsItem): boolean {
  return "explicit_content" in item
    ? Boolean(Number(item.explicit_content))
    : false;
}

/** The tracks a page lists. A song page lists itself. */
export function getSongs(item: DetailsItem): Song[] {
  if (isKind(item, "song")) return [item];
  const list = "list" in item ? item.list : undefined;
  return Array.isArray(list) ? list : [];
}
