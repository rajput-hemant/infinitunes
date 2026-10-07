"use client";

import { buttonVariants } from "@infinitunes/ui/components/button";
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
        className="flex w-max min-w-full gap-x-2 border-y"
      >
        {navlist.map(({ title, href }) => {
          const isActive = href === pathname;

          return (
            <div
              key={title}
              className={cn(
                "inline-block h-full shrink-0 border-b-2 border-transparent py-2 hover:border-primary",
                isActive && "border-primary",
              )}
            >
              <Link
                ref={isActive ? scrollActiveIntoView : undefined}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  "font-normal",
                  isActive && "font-medium",
                )}
              >
                {title}
              </Link>
            </div>
          );
        })}
      </nav>

      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
}
