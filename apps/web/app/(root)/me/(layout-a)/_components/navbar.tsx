"use client";

import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { cn } from "~/lib/utils";

type NavItem = {
  title: string;
  href: Route;
};

const navlist: NavItem[] = [
  { title: "My Playlists", href: "/me" },
  { title: "Recently Played", href: "/me/recently-played" },
  { title: "Liked Songs", href: "/me/liked-songs" },
  { title: "Liked Albums", href: "/me/albums" },
  { title: "Liked Playlists", href: "/me/playlists" },
  { title: "Liked Artists", href: "/me/artists" },
  { title: "Liked Podcasts", href: "/me/shows" },
];

export function Navbar() {
  const pathname = usePathname();
  // Attached only to the active link, so it runs when the active tab changes.
  const scrollActiveIntoView = React.useCallback(
    (node: HTMLAnchorElement | null) =>
      node?.scrollIntoView({ inline: "center", block: "nearest" }),
    [],
  );

  return (
    <ScrollArea>
      <nav
        aria-label="Library"
        className="flex w-max min-w-full gap-6 border-b"
      >
        {navlist.map(({ title, href }) => {
          const isActive = href === pathname;

          return (
            <Link
              key={title}
              ref={isActive ? scrollActiveIntoView : undefined}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex h-(--ctl-lg) shrink-0 items-center font-semibold whitespace-nowrap text-muted-foreground transition-colors duration-fast -outline-offset-2 hover:text-foreground",
                isActive &&
                  "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
              )}
            >
              {title}
            </Link>
          );
        })}
      </nav>

      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}
