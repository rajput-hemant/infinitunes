import type { MediaType, Quality } from "./misc";
import { isMediaType, uniqueBy } from "./misc";
import type { Modules } from "./modules";

/**
 * Reading `home.home` (the launch data) the same way on every platform: the
 * featured playlist, quick picks and hero tiles from the typed sections, and
 * one card list per remaining section, whose entries are untyped upstream JSON.
 */

/** One entry of an untyped launch-data section, read field by field. */
export type HomeItem = {
  id: string;
  title: string;
  perma_url: string;
  subtitle?: string;
  type?: MediaType;
  image: Quality;
  explicit_content?: string | boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toHomeItem(raw: Record<string, unknown>): HomeItem {
  const { explicit_content: explicit } = raw;

  return {
    id: text(raw.id) ?? "",
    title: text(raw.title) ?? "",
    perma_url: text(raw.perma_url) ?? "",
    subtitle: text(raw.subtitle),
    type: isMediaType(raw.type) ? raw.type : undefined,
    image: text(raw.image) ?? "",
    explicit_content:
      typeof explicit === "boolean" || typeof explicit === "string"
        ? explicit
        : undefined,
  };
}

/** Card items of one launch-data section, or null when the section is not a list. */
export function homeItems(section: unknown): HomeItem[] | null {
  if (!Array.isArray(section)) return null;
  const entries: readonly unknown[] = section;
  return entries.filter(isRecord).map(toHomeItem);
}

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

export type HomeSectionItem = HomeItem & { type: MediaType };

export type HomeSection = {
  /** The launch-data key (`new_albums`, `charts`, ...). */
  key: string;
  /** Upstream's title from `modules`, still HTML-encoded; some sections have none. */
  title: string | undefined;
  items: HomeSectionItem[];
};

/**
 * Every card-list section in upstream's order, its items deduplicated and
 * typed (the section's own type when an item carries none). Empty sections
 * are dropped.
 */
export function homeSections(modules: Modules): HomeSection[] {
  return Object.entries(modules).flatMap(([key, section]) => {
    const items = SKIPPED_SECTIONS.has(key) ? null : homeItems(section);
    if (!items?.length) return [];
    return {
      key,
      title: modules.modules?.[key]?.title,
      items: uniqueBy(items, (item) => item.id || item.title).map((item) => ({
        ...item,
        type: item.type ?? SECTION_TYPE[key] ?? "playlist",
      })),
    };
  });
}

const QUICK_PICK_ALBUMS = 4;
const QUICK_PICK_PLAYLISTS = 4;
const HERO_TILES = 4;

/**
 * The top of the home page: the first top playlist as the featured one,
 * quick picks of new albums and the next playlists, and hero tiles from the
 * charts topped up with the remaining playlists.
 */
export function homeHighlights(modules: Modules) {
  const [featured, ...playlists] = modules.top_playlists;
  return {
    featured,
    quickPicks: [
      ...modules.new_albums.slice(0, QUICK_PICK_ALBUMS),
      ...playlists.slice(0, QUICK_PICK_PLAYLISTS),
    ],
    heroTiles: [
      ...(modules.charts ?? []),
      ...playlists.slice(QUICK_PICK_PLAYLISTS),
    ].slice(0, HERO_TILES),
  };
}
