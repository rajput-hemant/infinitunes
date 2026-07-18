"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
};

const navlist: NavItem[] = [
  { title: "My Playlists", href: "/me" },
  { title: "Recently Played", href: "/me/recently-played" },
  { title: "Liked Songs", href: "/me/liked-songs" },
  { title: "Albums", href: "/me/albums" },
  { title: "Playlists", href: "/me/playlists" },
  { title: "Artists", href: "/me/artists" },
  { title: "Podcasts", href: "/me/shows" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <ScrollArea>
      <nav className="flex gap-x-2 border-y">
        {navlist.map(({ title, href }) => {
          const isActive = href === pathname;

          return (
            <div
              key={title}
              className={cn(
                "inline-block h-full shrink-0 border-b-2 border-transparent py-2 hover:border-primary",
                isActive && "border-primary"
              )}
            >
              <Link
                href={href}
                title={title}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  "font-normal",
                  isActive && "font-medium"
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
