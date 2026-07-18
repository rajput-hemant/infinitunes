import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  type: string;
  query: string;
};

export const navItems = [
  { title: "Playlists", href: "/search/playlist" },
  { title: "Songs", href: "/search/song" },
  { title: "Albums", href: "/search/album" },
  { title: "Podcasts", href: "/search/show" },
  { title: "Artists", href: "/search/artist" },
];

export function SearchNavbar({ type, query }: Props) {
  return (
    <nav className="border-b">
      <div className="hidden h-full items-center gap-2 lg:flex">
        {navItems.map(({ title, href }) => {
          const isActive = type === href.split("/")[2];

          return (
            <div
              key={title}
              className={cn(
                "inline-block h-full border-b-2 border-transparent py-2 hover:border-primary",
                isActive && "border-primary"
              )}
            >
              <Link
                href={`${href}/${query}`}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  isActive && "font-medium"
                )}
              >
                {title}
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
