import type { Href } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";

import { LIKED_COLLECTIONS } from "./liked-collections";

type Shortcut = {
  title: string;
  icon: SymbolViewProps["name"];
  href: Href;
};

/** The hub's lists of saved things, in the order the web's library tabs show them. */
export const LIBRARY_SHORTCUTS: Shortcut[] = [
  {
    title: "Liked Songs",
    icon: { ios: "heart.fill", android: "favorite" },
    href: "/me/liked-songs",
  },
  {
    title: "Recently Played",
    icon: { ios: "clock", android: "history" },
    href: "/me/recently-played",
  },
  ...Object.values(LIKED_COLLECTIONS),
];
