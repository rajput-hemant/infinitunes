import type { AllSearch } from "@infinitunes/types";
import Link from "next/link";

import { cn } from "~/lib/utils";

import { getSearchItemHref, getSearchItems } from "./search-item";
import { searchHref } from "./search-query";
import { SearchRow } from "./search-row";
import { searchUi } from "./search-ui";

type SearchAllProps = {
  query: string;
  data: AllSearch;
  /** `palette` lists capped groups as listbox options; `page` adds a View all link per group. */
  variant?: "palette" | "page";
  onSelect?: () => void;
};

type SearchGroup = {
  label: string;
  routeType?: string;
  paletteLimit: number;
};

const GROUPS: Partial<Record<string, SearchGroup>> = {
  topquery: { label: "Top result", paletteLimit: 0 },
  songs: { label: "Songs", routeType: "song", paletteLimit: 4 },
  artists: { label: "Artists", routeType: "artist", paletteLimit: 3 },
  albums: { label: "Albums", routeType: "album", paletteLimit: 3 },
  playlists: { label: "Playlists", routeType: "playlist", paletteLimit: 3 },
  shows: { label: "Podcasts", routeType: "show", paletteLimit: 3 },
  episodes: { label: "Episodes", paletteLimit: 0 },
};

export function SearchAll(props: SearchAllProps) {
  const { query, data, variant = "page", onSelect } = props;
  const isPalette = variant === "palette";
  const trimmed = query.trim();

  return (
    <>
      {Object.entries(data)
        .sort(([, a], [, b]) => a.position - b.position)
        .map(([key, group]) => {
          const config = GROUPS[key];
          const limit = isPalette ? (config?.paletteLimit ?? 3) : undefined;
          if (limit === 0) return null;

          const items = getSearchItems(group).slice(0, limit);
          if (!items.length) return null;

          const labelId = `search-group-${key}`;
          const routeType = config?.routeType;

          return (
            <div
              key={key}
              role={isPalette ? "group" : undefined}
              aria-labelledby={isPalette ? labelId : undefined}
            >
              <div
                className={cn(
                  searchUi.groupLabel,
                  !isPalette && "flex items-center justify-between",
                )}
              >
                {isPalette ? (
                  <span id={labelId}>{config?.label ?? key}</span>
                ) : (
                  <h3>{config?.label ?? key}</h3>
                )}
                {!isPalette && routeType ? (
                  <Link
                    href={searchHref(trimmed, routeType)}
                    className={cn(searchUi.link, "tracking-normal normal-case")}
                  >
                    View all
                  </Link>
                ) : null}
              </div>

              {items.map((item) => (
                <SearchRow
                  key={item.id}
                  href={getSearchItemHref(item)}
                  title={item.title}
                  subtitle={item.subtitle ?? item.extra}
                  visual={{ kind: "image", src: item.image, type: item.type }}
                  round={item.type === "artist"}
                  option={isPalette}
                  onSelect={onSelect}
                />
              ))}
            </div>
          );
        })}
    </>
  );
}
