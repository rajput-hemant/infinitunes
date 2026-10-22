import { legacyArtistPath } from "@infinitunes/core/entity-route";
import { Platform } from "react-native";

/** `infinitunes://artist/x-songs/tok?a=1` or `/artist/x-songs/tok` -> `/artist/x-songs/tok`. */
function pathnameOf(url: string): string {
  const withoutScheme = url.replace(/^[a-z][a-z\d+.-]*:\/\//i, "");
  return `/${withoutScheme.split(/[?#]/)[0]?.replace(/^\/+/, "") ?? ""}`;
}

/** The link's `?query` (and `#hash`), as it came. */
function suffixOf(url: string): string {
  const start = url.search(/[?#]/);
  return start === -1 ? "" : url.slice(start);
}

/**
 * Where a `/search` link opens: iOS's search tab, or on Android (no search
 * tab) the search screen in Home's stack. A bare `/search` would resolve to the
 * search tab's group, which Android does not show and would leave for Home,
 * dropping the `?q=` that Siri and Google Assistant links carry.
 */
function searchPath(): string {
  return Platform.OS === "android"
    ? "/(tabs)/(home)/search"
    : "/(tabs)/(search)/search";
}

/**
 * Incoming links use the web's paths, which are the app's routes. The web's
 * legacy artist links (`/artist/<name>-songs/<token>`, also JioSaavn's own
 * shape) are rewritten onto the tab routes the web redirects them to, and a
 * search link onto this platform's search screen.
 */
export function redirectSystemPath({ path }: { path: string }): string {
  const pathname = pathnameOf(path).replace(/\/+$/, "") || "/";
  // Create is an action, not a screen: its link opens the New Playlist sheet.
  if (pathname === "/create") return `/create-playlist${suffixOf(path)}`;
  // The web's `/search/<type>?q=` too. The screen takes only `q` (its type
  // chips are local state), so the type segment is dropped.
  if (pathname === "/search" || /^\/search\/[^/]+$/.test(pathname))
    return `${searchPath()}${suffixOf(path)}`;
  // The web's label Albums tab (`/label/<name>/<token>/albums`): the native
  // label screen is one page, so the link opens it at the label's route.
  if (/^\/label\/[^/]+\/[^/]+\/albums$/.test(pathname))
    return `${pathname.slice(0, -"/albums".length)}${suffixOf(path)}`;
  // JioSaavn's own playlist links (`/featured/<name>/<token>`) open the playlist route.
  if (/^\/featured\/[^/]+\/[^/]+$/.test(pathname))
    return `/playlist${pathname.slice("/featured".length)}${suffixOf(path)}`;
  return legacyArtistPath(pathname) ?? path;
}
