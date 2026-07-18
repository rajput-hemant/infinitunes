import {
  Disc3,
  History,
  Library,
  ListMusic,
  Mic2,
  Podcast,
  Radio,
  Star,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const sidebarNav: NavItem[] = [
  {
    title: "Top Albums",
    href: "/album",
    icon: Library,
  },
  {
    title: "Top Charts",
    href: "/chart",
    icon: Disc3,
  },
  {
    title: "Top Playlists",
    href: "/playlist",
    icon: ListMusic,
  },
  {
    title: "Podcasts",
    href: "/show",
    icon: Podcast,
  },
  {
    title: "Top Artists",
    href: "/artist",
    icon: Mic2,
  },
  {
    title: "Radio",
    href: "/radio",
    icon: Radio,
  },

  // authenticated routes
  {
    title: "Recently Played",
    href: "/me/recently-played",
    icon: History,
  },
  {
    title: "Your Favorite",
    href: "/me/liked-songs",
    icon: Star,
  },
];
