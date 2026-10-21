import { decode, toCardItem, uniqueBy } from "@infinitunes/types";
import type { CardItem, MediaType, Modules } from "@infinitunes/types";
import type { Href } from "expo-router";

/** Launch-data keys that hold configuration, not card lists. */
const SKIPPED_SECTIONS = new Set([
  "modules",
  "global_config",
  "browse_discover",
]);

/** Card type for sections whose items carry none. */
const SECTION_TYPE: Record<string, MediaType> = {
  new_albums: "album",
  charts: "playlist",
  top_playlists: "playlist",
  radio: "radio_station",
};

const SECTION_LIST: Record<string, Href> = {
  new_albums: "/browse/albums",
  charts: "/charts",
  top_playlists: "/browse/playlists",
  radio: "/radio",
};

const QUICK_PICK_ALBUMS = 4;
const QUICK_PICK_PLAYLISTS = 4;
const HERO_TILES = 4;

const MEDIA_TYPES = [
  "artist",
  "album",
  "playlist",
  "radio",
  "radio_station",
  "song",
  "channel",
  "mix",
  "show",
  "episode",
  "season",
  "label",
] as const satisfies readonly MediaType[];

function isMediaType(value: string | undefined): value is MediaType {
  return MEDIA_TYPES.some((type) => type === value);
}

function textField(item: object, key: string): string | undefined {
  const value: unknown = Reflect.get(item, key);
  return typeof value === "string" ? value : undefined;
}

/**
 * Launch-data sections beyond the typed ones are untyped upstream JSON, so
 * each entry is read field by field. An entry without a title or link cannot
 * be shown and is dropped.
 */
function toSectionCard(raw: unknown, section: string): CardItem | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const title = textField(raw, "title");
  const url = textField(raw, "perma_url");
  if (!title || !url) return undefined;
  const type = textField(raw, "type");

  return toCardItem({
    id: textField(raw, "id") || title,
    title,
    perma_url: url,
    subtitle: textField(raw, "subtitle"),
    type: isMediaType(type) ? type : (SECTION_TYPE[section] ?? "playlist"),
    image: textField(raw, "image") ?? "",
    explicit_content: textField(raw, "explicit_content"),
  });
}

export type HomeShelf = {
  key: string;
  title: string;
  items: CardItem[];
  /** Every item is a radio station, so its cards play and open the station screen. */
  stations: boolean;
  seeAllHref?: Href;
};

export type HomeModel = {
  featured: CardItem | undefined;
  heroTiles: CardItem[];
  quickPicks: CardItem[];
  shelves: HomeShelf[];
};

function buildShelves(modules: Modules): HomeShelf[] {
  return Object.entries(modules).flatMap(([key, section]) => {
    const title = modules.modules?.[key]?.title;
    if (SKIPPED_SECTIONS.has(key) || !Array.isArray(section) || !title) {
      return [];
    }
    const items = uniqueBy(
      section.flatMap((raw) => toSectionCard(raw, key) ?? []),
      (item) => item.id,
    );
    if (items.length === 0) return [];

    return {
      key,
      title: decode(title),
      items,
      stations: items.every((item) => item.type === "radio_station"),
      seeAllHref: SECTION_LIST[key],
    };
  });
}

/**
 * The home screen's content from the launch data: the featured playlist,
 * four tiles from the charts, quick picks of new albums and playlists, then
 * one shelf per titled section in upstream's order.
 */
export function buildHomeModel(modules: Modules): HomeModel {
  const [featured, ...playlists] = modules.top_playlists;
  const quickPickPlaylists = playlists.slice(0, QUICK_PICK_PLAYLISTS);
  const heroTilePlaylists = playlists.slice(QUICK_PICK_PLAYLISTS);

  return {
    featured: featured && toCardItem(featured),
    heroTiles: [...(modules.charts ?? []), ...heroTilePlaylists]
      .slice(0, HERO_TILES)
      .map(toCardItem),
    quickPicks: [
      ...modules.new_albums.slice(0, QUICK_PICK_ALBUMS),
      ...quickPickPlaylists,
    ].map(toCardItem),
    shelves: buildShelves(modules),
  };
}

export function isHomeEmpty({ featured, quickPicks, shelves }: HomeModel) {
  return !featured && quickPicks.length === 0 && shelves.length === 0;
}
