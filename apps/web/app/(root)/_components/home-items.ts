import type { MediaType, Quality } from "@infinitunes/types";

export type HomeItem = {
  id: string;
  title: string;
  perma_url: string;
  subtitle?: string;
  type?: MediaType;
  image: Quality;
  explicit_content?: string | boolean;
};

const MEDIA_TYPES: Record<MediaType, true> = {
  artist: true,
  album: true,
  playlist: true,
  radio: true,
  radio_station: true,
  song: true,
  channel: true,
  mix: true,
  show: true,
  episode: true,
  season: true,
  label: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && Object.hasOwn(MEDIA_TYPES, value);
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

function isUnknownList(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Card items of one launch-data section, or null when the section is not a
 * list. Upstream sections are untyped, so each entry is read field by field.
 */
export function homeItems(section: unknown): HomeItem[] | null {
  if (!isUnknownList(section)) return null;

  return section.filter(isRecord).map(toHomeItem);
}
