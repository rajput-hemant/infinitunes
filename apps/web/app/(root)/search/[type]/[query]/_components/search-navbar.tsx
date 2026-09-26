import { buttonVariants } from "@infinitunes/ui/components/button";
import Link from "next/link";

import { asRoute, cn } from "~/lib/utils";

type Props = {
  type: string;
  query: string;
};

export const navItems = [
  { title: "Playlists", type: "playlist" },
  { title: "Songs", type: "song" },
  { title: "Albums", type: "album" },
  { title: "Podcasts", type: "show" },
  { title: "Artists", type: "artist" },
];

export function SearchNavbar({ type, query }: Props) {
  return (
    <nav className="border-b">
      <div className="hidden h-full items-center gap-2 lg:flex">
        {navItems.map(({ title, type: navType }) => {
          const isActive = type === navType;

          return (
            <div
              key={title}
              className={cn(
                "inline-block h-full border-b-2 border-transparent py-2 hover:border-primary",
                isActive && "border-primary",
              )}
            >
              <Link
                href={asRoute(`/search/${navType}/${query}`)}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  isActive && "font-medium",
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
