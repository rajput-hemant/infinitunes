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
 * @returns The formatted duration
 */
export function formatDuration(
  seconds: number | string,
  format: "hh:mm:ss" | "mm:ss",
) {
  const date = new Date(Number(seconds) * 1000);

  return format === "hh:mm:ss"
    ? date.toISOString().slice(11, 19)
    : date.toISOString().slice(14, 19);
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
