import { ARTIST_TABS } from "@infinitunes/core/entity-route";
import type { ArtistTab } from "@infinitunes/core/entity-route";
import type { Category } from "@infinitunes/types";

export const ARTIST_TAB_LABELS: Record<ArtistTab, string> = {
  overview: "Overview",
  songs: "Songs",
  albums: "Albums",
  bio: "Biography",
};

/** The artist page's sections; Biography only exists for an artist who has one. */
export function visibleTabs(hasBio: boolean): readonly ArtistTab[] {
  return hasBio ? ARTIST_TABS : ARTIST_TABS.filter((tab) => tab !== "bio");
}

export const CATEGORIES = [
  "popularity",
  "latest",
  "alphabetical",
] as const satisfies readonly Category[];

export const CATEGORY_LABELS: Record<Category, string> = {
  popularity: "Popular",
  latest: "Date",
  alphabetical: "Name",
};
