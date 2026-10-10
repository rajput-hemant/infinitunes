import Link from "next/link";

import { searchHref } from "~/components/search/search-query";
import { searchUi } from "~/components/search/search-ui";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import type { SearchType } from "./type-map";

type Props = {
  type: SearchType;
  query: string;
};

export const navItems = [
  { title: "All", type: "all" },
  { title: "Songs", type: "song" },
  { title: "Albums", type: "album" },
  { title: "Playlists", type: "playlist" },
  { title: "Artists", type: "artist" },
  { title: "Podcasts", type: "show" },
] as const;

export function SearchNavbar({ type, query }: Props) {
  return (
    <nav aria-label="Filter search results">
      <div className={searchUi.chipsRow}>
        {navItems.map(({ title, type: navType }) => {
          const isActive = type === navType;

          return (
            <Link
              key={navType}
              href={searchHref(query, navType)}
              className={cn(
                controlStyles.text,
                searchUi.chip,
                "px-3",
                isActive && searchUi.chipActive,
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
