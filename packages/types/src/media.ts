import type {
  ImageQuality,
  MediaType,
  Quality,
  Queue,
  StreamQuality,
} from "./misc";
import { parseToken, QUALITIES_MAP } from "./misc";
import type { Episode } from "./show";
import type { Song } from "./song";

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^= h >>> 16) >>> 0;
}

export function seededRandom(seed: string) {
  let a = xmur3(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededIndex(seed: string, length: number) {
  if (length <= 0) return 0;
  return Math.floor(seededRandom(seed)() * length);
}

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

/**
 * Extracts the trailing token from a JioSaavn perma_url.
 */
export function getToken(url: string | undefined): string {
  return parseToken(url ?? "");
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

export function toQueue(item: Song | Episode): Queue {
  return {
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
 * Removes every queue entry with `id` and re-anchors `currentIndex` so the
 * playing track stays selected when an earlier entry is removed. If the
 * playing entry itself is removed the index now points at the following track
 * (clamped to the new last index).
 */
export function removeFromQueue(
  queue: Queue[],
  currentIndex: number,
  id: string,
): { queue: Queue[]; currentIndex: number } {
  if (!queue.some((item) => item.id === id)) return { queue, currentIndex };
  const next = queue.filter((item) => item.id !== id);
  const removedBefore = queue
    .slice(0, currentIndex)
    .filter((item) => item.id === id).length;
  const index = Math.min(currentIndex - removedBefore, next.length - 1);
  return { queue: next, currentIndex: Math.max(0, index) };
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
