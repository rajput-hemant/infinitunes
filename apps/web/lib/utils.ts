import { entityRoute, entityRoutePath } from "@infinitunes/core/entity-route";
import { decode } from "@infinitunes/types";
import type { MediaType } from "@infinitunes/types";
import { cn } from "@infinitunes/ui/lib/utils";
import type { Route } from "next";

export { cn };

/** Destructive text on the tint: red-700 clears 4.5:1 in light; dark needs red-300 (the token measures 4.28:1 on the dialog tint). */
export const destructiveText = "text-red-700 dark:text-red-300";

export function asRoute(href: string): Route {
  return href as Route;
}

/**
 * Returns `raw` only when it is a same-origin path (`/library?x=1`); anything
 * else (absolute URLs, `//host`, `/\\host`, `javascript:`) falls back to `/`.
 * Use for every user-controlled post-login redirect target.
 */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.includes("\\")) return "/";
  try {
    const url = new URL(raw, "http://localhost");
    if (url.origin !== "http://localhost") return "/";
  } catch {
    return "/";
  }
  return raw;
}

/**
 * Builds an `/api/og` URL. Raw JioSaavn titles/subtitles arrive HTML-encoded
 * (`&amp;`), so they must be decoded and percent-encoded or the trailing
 * `image` param gets truncated and the OG card renders without artwork.
 */
export function ogImageUrl(params: {
  title: string;
  description: string;
  image?: string;
  square?: boolean;
}) {
  const query = new URLSearchParams({
    title: decode(params.title),
    description: decode(params.description),
  });
  if (params.image) query.set("image", params.image);
  if (params.square) query.set("square", "true");
  return `/api/og?${query}`;
}

export function getHref(
  url: string | undefined | null,
  type: MediaType,
): Route {
  if (!url) return asRoute("#");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return asRoute(url);
  }

  // Upstream artist names carry the tab (`<name>-songs`): the route links the tab directly.
  const route = entityRoute(url, type);
  return asRoute(route ? entityRoutePath(route) : "#");
}

export function isMacOs() {
  if (typeof window === "undefined") return false;

  return window.navigator.userAgent.includes("Mac");
}
