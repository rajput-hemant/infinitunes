"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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

export function MeNavbar() {
  const pathname = usePathname();

  return (
    <nav className="space-x-2 border-b">
      {navlist.map(({ title, href }) => {
        const isActive = href === pathname;

        return (
          <div
            key={title}
            className={cn(
              "hover:border-primary inline-block h-full border-b-2 border-transparent py-2",
              isActive && "border-primary"
            )}
          >
            <Link
              href={href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                isActive && "font-medium"
              )}
            >
              {title}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
