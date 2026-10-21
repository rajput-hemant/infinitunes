import {
  decode,
  homeHighlights,
  homeSections,
  toCardItem,
} from "@infinitunes/types";
import type { CardItem, HomeSection, Modules } from "@infinitunes/types";
import type { Href } from "expo-router";

/** The full list behind a section's "See all". */
const SECTION_LIST: Record<string, Href> = {
  new_albums: "/album",
  charts: "/chart",
  top_playlists: "/playlist",
  radio: "/radio",
};

export type HomeShelf = {
  key: string;
  title: string;
  items: CardItem[];
  /** Every item is a radio station, so its cards play and open the station screen. */
  stations: boolean;
  seeAllHref?: Href;
};

export type HomeModel = {
  featured: CardItem | undefined;
  heroTiles: CardItem[];
  quickPicks: CardItem[];
  shelves: HomeShelf[];
};

/** A titled section as a shelf; an entry without a title or link cannot be shown. */
function toShelf({ key, title, items }: HomeSection): HomeShelf[] {
  const cards = items.flatMap((item) =>
    item.title && item.perma_url
      ? toCardItem({
          ...item,
          id: item.id || item.title,
          explicit_content:
            typeof item.explicit_content === "string"
              ? item.explicit_content
              : undefined,
        })
      : [],
  );
  if (!title || cards.length === 0) return [];
  return [
    {
      key,
      title: decode(title),
      items: cards,
      stations: cards.every((card) => card.type === "radio_station"),
      seeAllHref: SECTION_LIST[key],
    },
  ];
}

/**
 * The home screen's content from the launch data (`homeHighlights` and
 * `homeSections`, as on the web): the featured playlist, hero tiles, quick
 * picks, then one shelf per titled section in upstream's order.
 */
export function buildHomeModel(modules: Modules): HomeModel {
  const { featured, quickPicks, heroTiles } = homeHighlights(modules);
  return {
    featured: featured && toCardItem(featured),
    heroTiles: heroTiles.map(toCardItem),
    quickPicks: quickPicks.map(toCardItem),
    shelves: homeSections(modules).flatMap(toShelf),
  };
}

export function isHomeEmpty({ featured, quickPicks, shelves }: HomeModel) {
  return !featured && quickPicks.length === 0 && shelves.length === 0;
}
