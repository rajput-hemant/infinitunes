import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { siteConfig } from "~/config/site";
import type { ImageQuality, Quality, StreamQuality, Type } from "~/types";
import type { Queue } from "~/types/misc";
import type { Episode } from "~/types/show";
import type { Song } from "~/types/song";

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

/**
 * Maps a raw JioSaavn song/episode payload into a queue item.
 */
export function toQueue(item: Song | Episode): Queue {
  const more = item.more_info;
  return {
    id: item.id,
    title: decode(item.title),
    subtitle: decode(item.subtitle),
    perma_url: item.perma_url,
    type: item.type,
    image: getImageSrc(item.image),
    artists: more.artistMap?.artists ?? [],
    download_url: "download_url" in item ? item.download_url : "",
    duration: more.duration ?? "",
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

export function getHref(url: string, type: Type) {
  const re = /https:\/\/www.jiosaavn.com\/(s\/)?\w*/;
  return `/${url.replace(re, type)}`;
}

// Raw JioSaavn images are a single URL string.
export function getImageSrc(image: Quality, _quality?: ImageQuality) {
  const link = typeof image === "string" ? image : String(image);
  // replace http with https if not present
  return link.replace(/^http:\/\//, "https://");
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
