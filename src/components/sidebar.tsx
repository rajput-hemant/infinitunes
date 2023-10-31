"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Plus } from "lucide-react";

import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { H3, Muted } from "./ui/topography";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export default function Sidebar({ className }: SidebarProps) {
  const [segment] = useSelectedLayoutSegments();

  return (
    <aside
      className={cn(
        "animate-in slide-in-from-left-full p-4 [animation-duration:500ms]",
        className
      )}
    >
      <H3 className="px-4 pb-4">Discover</H3>

      {sidebarNav.map(({ title, href, icon: Icon }) => {
        const isActive = href === "/" + (segment ?? "");

        return (
          <Link
            key={title}
            href={href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground my-1 flex justify-start",
              isActive && "bg-secondary text-secondary-foreground font-bold"
            )}
          >
            <Icon className="mr-2 h-5 w-5" />
            {title}
          </Link>
        );
      })}

      <H3 className="p-4">Playlists</H3>

      <div className="mx-4 space-y-2">
        <Button title="Create Playlist" className="my-2 w-full">
          <Plus className="mr-1 h-4 w-4" />

          <span className="truncate">Create Playlist</span>
        </Button>

        <Muted>You need to be logged in to create a playlist.</Muted>
      </div>
    </aside>
  );
}
