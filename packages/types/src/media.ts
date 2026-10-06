import type {
  ImageQuality,
  MediaType,
  Quality,
  Queue,
  StreamQuality,
} from "./misc";
import { QUALITIES_MAP } from "./misc";
import type { Episode } from "./show";
import type { Song } from "./song";

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Decodes the HTML entities present in raw JioSaavn payloads (e.g. `&amp;`).
 */
export function decode(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (match, name: string) => ENTITY_MAP[name.toLowerCase()] ?? match,
    );
}

type RawCardItem = {
  id: string;
  title: string;
  perma_url: string;
  subtitle?: string;
  type: MediaType;
  image: string;
  explicit_content?: string;
};

/**
 * Adapts a raw JioSaavn item (title/perma_url/explicit_content) to the
 * `SliderCard`/`SliderList` prop shape (name/url/explicit) - a client-only
 * presentational contract, not a wire shape.
 */
export function toCardItem(item: RawCardItem) {
  return {
    id: item.id,
    name: decode(item.title),
    url: item.perma_url,
    subtitle: item.subtitle ? decode(item.subtitle) : undefined,
    type: item.type,
    image: item.image,
    explicit: item.explicit_content,
  };
}

let queueItemCounter = 0;

/** A fresh id for one queue entry; used for React keys and removal. */
export function newQueueItemId(): string {
  queueItemCounter += 1;
  return `${Date.now().toString(36)}-${queueItemCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Gives entries persisted before `queueItemId` existed (or otherwise missing
 * it) an id, and re-ids any duplicate id so keys stay unique. Returns the same
 * array when nothing needed fixing.
 */
export function ensureQueueItemIds(queue: Queue[]): Queue[] {
  const seen = new Set<string>();
  let changed = false;
  const next = queue.map((item) => {
    const existing = (item as Partial<Queue>).queueItemId;
    if (existing && !seen.has(existing)) {
      seen.add(existing);
      return item;
    }
    changed = true;
    const queueItemId = newQueueItemId();
    seen.add(queueItemId);
    return { ...item, queueItemId };
  });
  return changed ? next : queue;
}

export function toQueue(item: Song | Episode): Queue {
  return {
    queueItemId: newQueueItemId(),
    id: item.id,
    name: decode(item.title),
    subtitle: decode(item.subtitle),
    url: item.perma_url,
    type: item.type,
    image: getImageSrc(item.image),
    artists: item.more_info.artistMap?.artists ?? [],
    download_url: item.download_url ?? item.more_info.download_url ?? "",
    duration: Number(item.more_info.duration) || 0,
  };
}

/**
 * Formats the given duration in seconds to the given format
 * @param seconds The duration in seconds
 * @param format The format to format the duration in `hh:mm:ss` or `mm:ss`
 * @returns The formatted duration. Hours (or minutes, in `mm:ss`) keep
 * counting past 24h (or 60m) instead of wrapping, and missing, negative or
 * non-numeric input renders as zero instead of throwing.
 */
export function formatDuration(
  seconds: number | string,
  format: "hh:mm:ss" | "mm:ss",
) {
  const parsed = Number(seconds);
  const total = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  const pad = (n: number) => String(n).padStart(2, "0");
  const secs = total % 60;

  if (format === "hh:mm:ss") {
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(secs)}`;
  }
  return `${pad(Math.floor(total / 60))}:${pad(secs)}`;
}

/**
 * Picks the next shuffled queue index. Unlike a plain random pick it never
 * returns `current` when another track exists: selecting the same index is a
 * no-op for the player (no state change, so no reload) and playback would stop.
 * `random` is injectable for tests.
 */
export function pickShuffleIndex(
  length: number,
  current: number,
  random: () => number = Math.random,
) {
  if (length <= 1) return Math.max(0, Math.min(current, length - 1));
  const offset = 1 + Math.floor(random() * (length - 1));
  return (current + offset) % length;
}

/**
 * Removes the queue entry at `removeIndex` (duplicates of the same track are
 * separate entries) and re-anchors `currentIndex` so the playing entry stays
 * selected when an earlier entry is removed. If the playing entry itself is
 * removed the index now points at the following track (clamped to the new
 * last index). An out-of-range index leaves the queue untouched.
 */
export function removeFromQueue(
  queue: Queue[],
  currentIndex: number,
  removeIndex: number,
): { queue: Queue[]; currentIndex: number } {
  if (removeIndex < 0 || removeIndex >= queue.length) {
    return { queue, currentIndex };
  }
  const next = queue.filter((_, i) => i !== removeIndex);
  const index = removeIndex < currentIndex ? currentIndex - 1 : currentIndex;
  return {
    queue: next,
    currentIndex: Math.max(0, Math.min(index, next.length - 1)),
  };
}

const countFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(n: number | string | undefined | null): string {
  const parsed = Number(n);
  if (!Number.isFinite(parsed) || parsed < 0) return "0";
  return countFormatter.format(parsed);
}

/** Formats a release date string, returning an empty string for missing or invalid input. */
export function formatReleaseDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const d = new Date(String(dateStr));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const IMAGE_SIZE: Record<ImageQuality, number> = {
  low: 50,
  medium: 150,
  high: 500,
};

function withSize(url: string, size: number) {
  return url.replace(
    /([-_])\d+x\d+(?=\.\w+(?:\?.*)?$)/,
    (_match, sep: string) => `${sep}${size}x${size}`,
  );
}

export function getImageSrc(
  image: Quality,
  quality?: ImageQuality,
  width?: number,
) {
  const link = typeof image === "string" ? image : String(image);
  const sized = link.replace(/^http:\/\//, "https://");
  if (!quality) return sized;
  const size = width ?? IMAGE_SIZE[quality];
  return withSize(sized, size);
}

/**
 * `withDownloadUrl` attaches every decrypted bitrate as one comma-separated
 * string, ordered to match `QUALITIES_MAP`. Pick the requested bitrate out of
 * it, falling back to the highest available bitrate.
 */
export function getDownloadLink(url: Quality, quality?: StreamQuality) {
  if (typeof url !== "string") return "";
  const links = url
    .split(",")
    .map((link) => link.trim().replace(/^http:\/\//, "https://"))
    .filter(Boolean);
  if (links.length === 0) return "";
  const index = QUALITIES_MAP.findIndex((q) => q.quality === quality);
  return links[index] ?? links.at(-1) ?? "";
}
