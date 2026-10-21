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

type HomeShelf = {
  key: string;
  title: string;
  items: CardItem[];
  seeAllHref?: Href;
};

export type HomeModel = {
  /** The featured playlist, then the chart and playlist tiles. */
  carousel: CardItem[];
  quickPicks: CardItem[];
  shelves: HomeShelf[];
};

/** Quick picks after the Surprise Me and Browse tiles: four rows of two. */
const QUICK_PICKS = 6;

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
      seeAllHref: SECTION_LIST[key],
    },
  ];
}

/**
 * The home screen's content from the launch data (`homeHighlights` and
 * `homeSections`, as on the web): the featured carousel, up to six quick
 * picks, then one shelf per titled section in upstream's order.
 */
export function buildHomeModel(modules: Modules): HomeModel {
  const { featured, quickPicks, heroTiles } = homeHighlights(modules);
  return {
    carousel: [...(featured ? [featured] : []), ...heroTiles].map(toCardItem),
    quickPicks: quickPicks.slice(0, QUICK_PICKS).map(toCardItem),
    shelves: homeSections(modules).flatMap(toShelf),
  };
}

/** No catalog data at all (the Surprise Me and Browse tiles need none). */
export function isHomeEmpty({ carousel, quickPicks, shelves }: HomeModel) {
  return (
    carousel.length === 0 && quickPicks.length === 0 && shelves.length === 0
  );
}
