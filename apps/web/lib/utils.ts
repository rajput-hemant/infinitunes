import { decode } from "@infinitunes/types";
import type { MediaType } from "@infinitunes/types";
import { cn } from "@infinitunes/ui/lib/utils";
import type { Route } from "next";
import { toast } from "sonner";

import { siteConfig } from "~/config/site";

export { cn };

export function asRoute(href: string): Route {
  return href as Route;
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

export function getHref(
  url: string | undefined | null,
  type: MediaType,
): Route {
  if (!url) return asRoute("#");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return asRoute(url);
  }

  const match = JIOSAAVN_URL_RE.exec(url);
  if (!match) return asRoute("#");

  const path = (match[1] ?? "").split(/[?#]/)[0];
  const segments = path.split("/").filter(Boolean);
  const count = type === "show" ? 3 : 2;
  if (segments.length < count) return asRoute("#");

  const trailing = segments.slice(-count);
  return asRoute(`/${type}/${trailing.join("/")}`);
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
