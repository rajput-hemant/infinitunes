import { parseToken } from "@infinitunes/types";
import type { Href } from "expo-router";

/** What the details procedure needs: it resolves stations missing from upstream's rotating list by name. */
export type StationRef = { name: string; token: string };

/** `https:`, the host, the name and the token: a station URL has at least these. */
const MIN_URL_SEGMENTS = 4;

/** The name and token in a station's perma URL (`.../radio/<name>/<token>`), if it has both. */
export function stationRef(url: string): StationRef | undefined {
  const path = url.split(/[?#]/)[0] ?? "";
  const segments = path.split("/").filter(Boolean);
  const name = segments.at(-2);
  const token = parseToken(path);
  if (!name || !token || segments.length < MIN_URL_SEGMENTS) return undefined;
  return { name, token };
}

export function stationHref({ name, token }: StationRef): Href {
  return { pathname: "/radio/[name]/[token]", params: { name, token } };
}
