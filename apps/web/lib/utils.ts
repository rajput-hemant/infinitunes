import type {
  ImageQuality,
  Quality,
  StreamQuality,
  MediaType,
} from "@infinitunes/types";
import { parseToken, QUALITIES_MAP } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import type { Episode } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import { cn } from "@infinitunes/ui/lib/utils";
import { toast } from "sonner";

import { siteConfig } from "~/config/site";

export { cn };

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
 * Returns the absolute url for the given path based on the current environment
 * @param path The path to get the absolute url for
 * @returns The absolute url for the given path
 */
export function absoluteUrl(path: string) {
  if (process.env.VERCEL) {
    switch (process.env.NEXT_PUBLIC_VERCEL_ENV) {
      case "production":
        return `${siteConfig.url}${path}`;

      case "preview":
        return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}${path}`;

      default:
        // development
        return `http://localhost:${process.env.PORT ?? 3000}${path}`;
    }
  } else if (process.env.NETLIFY) {
    switch (process.env.CONTEXT) {
      case "production":
        return `${siteConfig.url}${path}`;

      case "deploy-preview":
      case "branch-deploy":
        return `https://${process.env.DEPLOY_PRIME_URL}${path}`;

      default:
        // development
        return `http://localhost:${process.env.PORT ?? 3000}${path}`;
    }
  } else {
    return `${siteConfig.url}${path}`;
  }
}

/**
 * Encodes and decodes strings to and from base64
 * @param str The string to encode/decode
 * @returns The encoded/decoded string
 */
export const base64 = {
  encode: (str: string) => Buffer.from(str).toString("base64"),
  decode: (str: string) => Buffer.from(str, "base64").toString("ascii"),
};

/**
 * Throws an error with the given message
 * @param message The Error message
 */
export function rethrow(message: string): never {
  throw new Error(message);
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

/**
 * Builds an `/api/og` URL. Raw JioSaavn titles/subtitles arrive HTML-encoded
 * (`&amp;`), so they must be decoded and percent-encoded or the trailing
 * `image` param gets truncated and the OG card renders without artwork.
 */
export function ogImageUrl(params: {
  title: string;
  description: string;
  image: string;
  square?: boolean;
}) {
  const query = new URLSearchParams({
    title: decode(params.title),
    description: decode(params.description),
    image: params.image,
  });
  if (params.square) query.set("square", "true");
  return `/api/og?${query}`;
}

const JIOSAAVN_URL_RE =
  /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:jiosaavn|saavn)\.com(?::\d+)?\/(.*)$/i;

export function getHref(url: string | undefined | null, type: MediaType) {
  if (!url) return "#";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  const match = JIOSAAVN_URL_RE.exec(url);
  if (!match) return "#";

  const path = (match[1] ?? "").split(/[?#]/)[0];
  const segments = path.split("/").filter(Boolean);
  const count = type === "show" ? 3 : 2;
  if (segments.length < count) return "#";

  const trailing = segments.slice(-count);
  return `/${type}/${trailing.join("/")}`;
}

// Raw JioSaavn images are a single URL string.
const IMAGE_SIZE: Record<ImageQuality, number> = {
  low: 50,
  medium: 150,
  high: 500,
};

// JioSaavn embeds the resolution token with either separator, depending on the
// CDN path: `...-500x500.jpg` for songs/albums, `..._150x150.jpg` for artists.
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

export function currentlyInDev() {
  toast.info("This feature is currently in development.", {
    description: "We're working on it and it'll be available soon.",
  });
}

export function isMacOs() {
  if (typeof window === "undefined") return false;

  return window.navigator.userAgent.includes("Mac");
}
