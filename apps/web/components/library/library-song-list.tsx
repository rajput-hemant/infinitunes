"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Episode, Song } from "@infinitunes/types";
import { decode } from "@infinitunes/types";
import { Input } from "@infinitunes/ui/components/input";
import React from "react";

import type { User } from "~/lib/auth";

import { SongListClient } from "../song-list/song-list.client";

type SortKey = "recent" | "title" | "artist";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "title", label: "Title A-Z" },
  { value: "artist", label: "Artist A-Z" },
];

function primaryArtists(item: Song | Episode): string[] {
  return (
    item.more_info.artistMap?.primary_artists?.map((artist) => artist.name) ??
    []
  );
}

function matchesQuery(item: Song | Episode, query: string): boolean {
  const haystack = [decode(item.title), item.subtitle, ...primaryArtists(item)]
    .join(" ")
    .toLocaleLowerCase();

  return haystack.includes(query);
}

function compareTitle(a: Song | Episode, b: Song | Episode): number {
  return decode(a.title).localeCompare(decode(b.title));
}

function compareArtist(a: Song | Episode, b: Song | Episode): number {
  const byArtist =
    (primaryArtists(a)[0] ?? "").localeCompare(primaryArtists(b)[0] ?? "") ||
    compareTitle(a, b);

  return byArtist;
}

type LibrarySongListProps = {
  user?: User;
  items: (Song | Episode)[];
  userFavorites?: Favorite;
  userPlaylists?: MyPlaylist[];
  showAlbum?: boolean;
  className?: string;
};

/**
 * Client-side sort and text filter over an already-loaded song list.
 * `recent` keeps the server order (recently added / recently played first).
 * Row-level unlike on mobile lives in each row's more-options menu
 * (`TileMoreButton` renders the favourite toggle in the mobile drawer).
 */
export function LibrarySongList(props: LibrarySongListProps) {
  const { user, items, userFavorites, userPlaylists, showAlbum, className } =
    props;

  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("recent");

  const visible = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const filtered = q ? items.filter((item) => matchesQuery(item, q)) : items;

    if (sort === "title") return [...filtered].sort(compareTitle);
    if (sort === "artist") return [...filtered].sort(compareArtist);
    return filtered;
  }, [items, query, sort]);

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          aria-label="Filter songs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title or artist"
          className="h-9 w-full sm:max-w-xs"
        />

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sort
          <select
            aria-label="Sort songs"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {(query || sort !== "recent") && visible.length > 0 && (
          <output className="text-sm text-muted-foreground tabular-nums">
            {visible.length} of {items.length}
          </output>
        )}
      </div>

      {visible.length ? (
        <SongListClient
          user={user}
          items={visible}
          showAlbum={showAlbum}
          userFavorites={userFavorites}
          userPlaylists={userPlaylists}
        />
      ) : (
        <output className="block py-10 text-center text-sm text-muted-foreground">
          No songs match “{query.trim()}”.
        </output>
      )}
    </div>
  );
}
