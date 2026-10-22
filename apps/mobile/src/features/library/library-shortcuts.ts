import type { Href } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";

import { LIKED_COLLECTIONS } from "./liked-collections";

type Shortcut = {
  title: string;
  icon: SymbolViewProps["name"];
  href: Href;
};

/** The hub's two large tiles: the lists a listener opens most. */
export const LIKED_SONGS: Shortcut = {
  title: "Liked Songs",
  icon: { ios: "heart.fill", android: "favorite" },
  href: "/me/liked-songs",
};

export const RECENTLY_PLAYED: Shortcut = {
  title: "Recently Played",
  icon: { ios: "clock", android: "history" },
  href: "/me/recently-played",
};

/** The other saved lists, as rows, in the order the web's library tabs show them. */
export const LIBRARY_SHORTCUTS: Shortcut[] = Object.values(LIKED_COLLECTIONS);
