import type {
  ImageQuality,
  Quality,
  StreamQuality,
  MediaType,
} from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import type { Episode } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { siteConfig } from "~/config/site";

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
  if (!url) return "";
  return url.split("/").filter(Boolean).pop() ?? "";
}

export function toQueue(item: Song | Episode): Queue {
  return {
    id: item.id,
    name: decode(item.name),
    subtitle: decode(item.subtitle),
    url: item.url,
    type: item.type as "song" | "episode",
    image: getImageSrc(item.image),
    artists: item.artist_map?.artists ?? [],
    download_url: "download_url" in item ? item.download_url : "",
    duration: item.duration ?? 0,
  };
}

/**
 * Merges the given class names with the tailwind classes
 * @param inputs The class names to merge
 * @returns The merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function getHref(url: string, type: MediaType) {
  if (!url) return "#";
  const re = /https:\/\/www.jiosaavn.com\/(s\/)?\w*/;
  return `/${url.replace(re, type)}`;
}

// Raw JioSaavn images are a single URL string.
const IMAGE_SIZE: Record<ImageQuality, number> = {
  low: 50,
  medium: 150,
  high: 500,
};

function withSize(url: string, size: number) {
  return url.replace(/_(\d+)x(\d+)(?=\.\w+$)/, `_${size}x${size}`);
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

export function getDownloadLink(url: Quality, _quality?: StreamQuality) {
  return typeof url === "string" ? url.replace(/^http:\/\//, "https://") : "";
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
