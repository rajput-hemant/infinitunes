import type { MediaType, Quality } from "@infinitunes/types";
import type { AllSearch } from "@infinitunes/types";
import { decode, getImageSrc } from "@infinitunes/types";
import Link from "next/link";

import { asRoute, cn, getHref } from "~/lib/utils";

import { ImageWithFallback } from "../image-with-fallback";
import { getPlaceholderSrc } from "../placeholder-src";
import { searchUi } from "./search-ui";

type SearchAllProps = {
  query: string;
  data: AllSearch;
  listboxId?: string;
  showSeeAllLink?: boolean;
};

const SECTION_LABELS: Record<keyof AllSearch, string> = {
  topquery: "Top result",
  songs: "Songs",
  albums: "Albums",
  playlists: "Playlists",
  artists: "Artists",
  shows: "Podcasts",
  episodes: "Episodes",
};

function routeTypeFromKey(key: keyof AllSearch): string | null {
  if (key === "topquery" || key === "episodes") return null;
  if (key === "shows") return "show";
  return key.slice(0, -1);
}

type SearchItem = {
  id: string;
  title: string;
  perma_url?: string;
  subtitle?: string;
  extra?: string;
  type: MediaType;
  image: Quality | string;
};

function SearchResultRow(props: {
  item: SearchItem;
  roundArt?: boolean;
}) {
  const { item, roundArt } = props;
  const href = item.perma_url
    ? getHref(item.perma_url, item.type)
    : asRoute(`/search/artist/${encodeURIComponent(item.title)}`);
  const subtitle = item.subtitle ?? item.extra;
  const image = item.image as Quality;

  return (
    <Link
      href={href}
      data-search-palette-row
      role="option"
      className={searchUi.paletteRow}
    >
      <div
        className={cn(
          searchUi.paletteArt,
          roundArt && searchUi.paletteArtRound,
        )}
      >
        <ImageWithFallback
          src={getImageSrc(image, "low")}
          alt=""
          fill
          sizes="36px"
          className={cn(
            "z-10 object-cover",
            getImageSrc(image, "low").includes("default") && "dark:invert",
          )}
          fallback={getPlaceholderSrc(item.type)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{decode(item.title)}</div>
        {subtitle ? (
          <div className="truncate text-xs capitalize text-muted-foreground">
            {decode(subtitle)}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function TopResultPanel({ item }: { item: SearchItem }) {
  const href = item.perma_url
    ? getHref(item.perma_url, item.type)
    : asRoute(`/search/artist/${encodeURIComponent(item.title)}`);
  const subtitle = item.subtitle ?? item.extra;
  const image = item.image as Quality;
  const roundArt = item.type === "artist";

  return (
    <Link
      href={href}
      data-search-palette-row
      role="option"
      className={cn(
        "grid gap-3 rounded-md border border-border bg-card p-4 transition-colors duration-fast hover:bg-fill",
        "sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center",
      )}
    >
      <div
        className={cn(
          "relative mx-auto size-24 overflow-hidden shadow-sm sm:mx-0",
          roundArt ? "rounded-full" : "rounded-md",
        )}
      >
        <ImageWithFallback
          src={getImageSrc(image, "medium")}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
          fallback={getPlaceholderSrc(item.type)}
        />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <h4 className="font-heading text-xl font-bold tracking-tight">
          {decode(item.title)}
        </h4>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {decode(subtitle)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function SearchAll({
  query,
  data,
  listboxId,
  showSeeAllLink = true,
}: SearchAllProps) {
  const trimmed = query.trim();

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label="Search results"
      className="space-y-2 p-1"
    >
      {showSeeAllLink && trimmed.length > 0 ? (
        <Link
          href={asRoute(`/search/song/${encodeURIComponent(trimmed)}`)}
          data-search-palette-row
          role="option"
          className={searchUi.paletteRow}
        >
          <div className={cn(searchUi.paletteArt, "grid place-items-center")}>
            <span className="text-xs font-semibold text-primary">All</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              Search for &quot;{trimmed}&quot;
            </div>
            <div className="truncate text-xs text-muted-foreground">
              See all song results
            </div>
          </div>
        </Link>
      ) : null}

      {Object.entries(data)
        .sort(([, a], [, b]) => a.position - b.position)
        .map(([key, value]) => {
          const sectionKey = key as keyof AllSearch;
          if (!value.data.length) return null;

          const routeType = routeTypeFromKey(sectionKey);
          const label = SECTION_LABELS[sectionKey] ?? key;

          return (
            <section key={key} aria-labelledby={`search-group-${key}`}>
              <div
                id={`search-group-${key}`}
                className={searchUi.groupLabel}
              >
                <span>{label}</span>
                {routeType ? (
                  <Link
                    href={asRoute(
                      `/search/${routeType}/${encodeURIComponent(trimmed)}`,
                    )}
                    className="normal-case tracking-normal text-primary hover:underline"
                  >
                    View all
                  </Link>
                ) : null}
              </div>

              {sectionKey === "topquery" ? (
                <TopResultPanel item={value.data[0] as SearchItem} />
              ) : (
                <div className="space-y-0.5">
                  {value.data.map((item) => (
                    <SearchResultRow
                      key={(item as SearchItem).id}
                      item={item as SearchItem}
                      roundArt={sectionKey === "artists"}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
    </div>
  );
}
