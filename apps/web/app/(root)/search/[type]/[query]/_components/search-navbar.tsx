import Link from "next/link";

import { searchUi } from "~/components/search/search-ui";
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
] as const;

export function SearchNavbar({ type, query }: Props) {
  return (
    <nav aria-label="Filter search results">
      <div className={searchUi.chipsRow}>
        {navItems.map(({ title, type: navType }) => {
          const isActive = type === navType;

          return (
            <Link
              key={title}
              href={asRoute(`/search/${navType}/${query}`)}
              className={cn(searchUi.chip, isActive && searchUi.chipActive)}
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
