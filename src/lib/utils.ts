import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { ImageQuality, Quality, StreamQuality, Type } from "@/types";

/**
 * Merges the given class names with the tailwind classes
 * @param inputs The class names to merge
 * @returns The merged class names
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

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

  return format === "hh:mm:ss"
    ? date.toISOString().slice(11, 19)
    : date.toISOString().slice(14, 19);
}

export const getHref = (url: string, type: Type) => {
  const re = /https:\/\/www.jiosaavn.com\/(s\/)?\w*/;
  return `/${url.replace(re, type)}`;
};

export const getImageSrc = (image: Quality, quality: ImageQuality) => {
  if (typeof image === "string") {
    return image;
  } else if (quality === "low") {
    return image[0].link;
  } else if (quality === "medium") {
    return image[1].link;
  } else {
    return image[2].link;
  }
};

export const getDownloadLink = (url: Quality, quality: StreamQuality) => {
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
};
