import {
  entityRoute,
  entityRoutePath,
  type EntityRoute,
} from "@infinitunes/core/entity-route";
import type { MediaType } from "@infinitunes/types";
import type { Href } from "expo-router";

/**
 * Detail screens live once in `app/(tabs)/(home,search,library,radio)/`, so opening
 * one keeps the tab it was opened from, at the web's own paths
 * (`/album/<name>/<token>`, `/show/<name>/<season>/<token>`, ...): a web link
 * opened with the app's scheme lands on the same screen.
 */
const ENTITY_ROUTES = {
  album: "/album/[name]/[token]",
  episode: "/episode/[name]/[token]",
  label: "/label/[name]/[token]",
  mix: "/mix/[name]/[token]",
  playlist: "/playlist/[name]/[token]",
  radio: "/radio/[name]/[token]",
  song: "/song/[name]/[token]",
} as const satisfies Partial<Record<MediaType, Href>>;

type EntityScreen = keyof typeof ENTITY_ROUTES;

function hasScreen(type: MediaType): type is EntityScreen {
  return type in ENTITY_ROUTES;
}

/** A station is typed `radio_station` upstream; its screen is under `/radio`, as on the web. */
export function routeOf(type: MediaType, url: string): EntityRoute | undefined {
  return entityRoute(url, type === "radio_station" ? "radio" : type);
}

/**
 * The screen for an upstream item, from its type and perma URL. `undefined`
 * for a URL that is not one, or a type without a screen (channels), so the
 * caller renders the item as not pressable.
 */
export function entityHref(type: MediaType, url: string): Href | undefined {
  const route = routeOf(type, url);
  if (!route) return undefined;
  switch (route.kind) {
    case "artist": {
      const { name, token, tab } = route;
      return tab === "overview"
        ? { pathname: "/artist/[name]/[token]", params: { name, token } }
        : {
            pathname: "/artist/[name]/[token]/[tab]",
            params: { name, token, tab },
          };
    }
    case "show": {
      const { name, season, token } = route;
      return {
        pathname: "/show/[name]/[season]/[token]",
        params: { name, season, token },
      };
    }
    case "entity": {
      const { type: screen, name, token } = route;
      return hasScreen(screen)
        ? { pathname: ENTITY_ROUTES[screen], params: { name, token } }
        : undefined;
    }
  }
}

/** The item's page path, the same on the web (`undefined` for a URL that is not one). */
export function entityPath(type: MediaType, url: string): string | undefined {
  const route = routeOf(type, url);
  return route && entityRoutePath(route);
}

/** What the station procedures take: the name and token of a station's URL. */
export type StationRef = { name: string; token: string };

export function stationRef(url: string): StationRef | undefined {
  const route = routeOf("radio_station", url);
  return route?.kind === "entity"
    ? { name: route.name, token: route.token }
    : undefined;
}
