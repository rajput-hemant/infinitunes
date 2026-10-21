import { legacyArtistPath } from "@infinitunes/core/entity-route";

/** `infinitunes://artist/x-songs/tok?a=1` or `/artist/x-songs/tok` -> `/artist/x-songs/tok`. */
function pathnameOf(url: string): string {
  const withoutScheme = url.replace(/^[a-z][a-z\d+.-]*:\/\//i, "");
  return `/${withoutScheme.split(/[?#]/)[0]?.replace(/^\/+/, "") ?? ""}`;
}

/**
 * Incoming links use the web's paths, which are the app's routes. Only the
 * web's legacy artist links (`/artist/<name>-songs/<token>`, also JioSaavn's
 * own shape) need rewriting, onto the tab routes the web redirects them to.
 */
export function redirectSystemPath({ path }: { path: string }): string {
  return legacyArtistPath(pathnameOf(path)) ?? path;
}
