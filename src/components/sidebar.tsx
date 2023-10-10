"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Plus } from "lucide-react";

import { sidebarNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { H3, Muted } from "./ui/topography";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export default function Sidebar({ className }: SidebarProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <aside
      className={cn(
        "p-4 animate-in slide-in-from-left-full [animation-duration:500ms]",
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
              "my-1 flex justify-start text-muted-foreground",
              isActive && "bg-secondary font-bold text-secondary-foreground"
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
