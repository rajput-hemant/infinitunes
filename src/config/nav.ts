import {
  Disc3,
  Library,
  ListMusic,
  LucideIcon,
  Mic2,
  Podcast,
  Radio,
} from "lucide-react";

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
    href: "/podcast",
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
];
