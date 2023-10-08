import Link from "next/link";
import {
  Disc3,
  Library,
  ListMusic,
  Mic2,
  Plus,
  Podcast,
  Radio,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { H3, Muted } from "./ui/topography";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

const SidebarItems = [
  {
    title: "Top Album",
    link: "/album",
    icon: Library,
  },
  {
    title: "Top Charts",
    link: "/charts",
    icon: Disc3,
  },
  {
    title: "Top Playlists",
    link: "/playlist",
    icon: ListMusic,
  },
  {
    title: "Podcasts",
    link: "/podcast",
    icon: Podcast,
  },
  {
    title: "Top Artists",
    link: "/artist",
    icon: Mic2,
  },
  {
    title: "Radio",
    link: "/radio",
    icon: Radio,
  },
];

export default function Sidebar({ className }: SidebarProps) {
  return (
    <div
      className={cn(
        "p-4 animate-in slide-in-from-left-full [animation-duration:500ms]",
        className
      )}
    >
      <H3 className="px-4 pb-4">Discover</H3>

      {SidebarItems.map(({ title, link, icon: Icon }) => (
        <Link
          key={title}
          href={link}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "flex justify-start"
          )}
        >
          <Icon className="mr-2 h-5 w-5" />
          {title}
        </Link>
      ))}

      <H3 className="p-4">Playlists</H3>

      <div className="mx-4 space-y-2">
        <Button variant="outline" className="my-2 w-full">
          <Plus className="mr-2 h-5 w-5" />
          Create Playlist
        </Button>

        <Muted>You need to be logged in to create a playlist.</Muted>
      </div>
    </div>
  );
}
