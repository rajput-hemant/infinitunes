import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";
import type { ImageQuality, Quality, StreamQuality, Type } from "@/types";

import { siteConfig } from "@/config/site";

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
export function formatDuration(seconds: number, format: "hh:mm:ss" | "mm:ss") {
  const date = new Date(seconds * 1000);

  return format === "hh:mm:ss" ?
      date.toISOString().slice(11, 19)
    : date.toISOString().slice(14, 19);
}

export function getHref(url: string, type: Type) {
  const re = /https:\/\/www.jiosaavn.com\/(s\/)?\w*/;
  return `/${url.replace(re, type)}`;
}

export function getImageSrc(image: Quality, quality: ImageQuality) {
  let link;

  if (typeof image === "string") {
    link = image;
  } else if (quality === "low") {
    link = image[0].link;
  } else if (quality === "medium") {
    link = image[1].link;
  } else {
    link = image[2].link;
  }

  // replace http with https if not present
  return link.replace(/http:\/\//, "https://");
}

export function getDownloadLink(url: Quality, quality: StreamQuality) {
  if (typeof url === "string") {
    return url;
  } else if (quality === "poor") {
    return url[0].link;
  } else if (quality === "low") {
    return url[1].link;
  } else if (quality === "medium") {
    return url[2].link;
  } else if (quality === "high") {
    return url[3].link;
  } else {
    return url[4].link;
  }
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
