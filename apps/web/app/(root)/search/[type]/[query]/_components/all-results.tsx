import { TRPCError } from "@trpc/server";
import { SearchX } from "lucide-react";
import Link from "next/link";

import { LibraryEmpty } from "~/components/library/library-section";
import type { SearchItem } from "~/components/search/search-item";
import {
  getSearchItemHref,
  getSearchItems,
} from "~/components/search/search-item";
import { searchHref } from "~/components/search/search-query";
import { SearchRow } from "~/components/search/search-row";
import { searchUi } from "~/components/search/search-ui";
import { TopResultCard } from "~/components/search/top-result-card";
import { SliderList } from "~/components/slider/slider-list";
import { api } from "~/lib/trpc/server";
import { cn } from "~/lib/utils";

type AllResultsProps = {
  query: string;
};

async function fetchAllSearch(query: string) {
  try {
    return await api.search.all({ q: query });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}

const SHELVES = [
  { key: "albums", title: "Albums" },
  { key: "artists", title: "Artists" },
  { key: "playlists", title: "Playlists" },
  { key: "shows", title: "Podcasts" },
] as const;

function toShelfItem(item: SearchItem) {
  return {
    id: item.id,
    name: item.title,
    type: item.type,
    url: item.perma_url ?? getSearchItemHref(item),
    image: item.image,
    subtitle: item.subtitle ?? item.extra,
    hidePlayButton: !item.perma_url,
  };
}

export async function AllResults({ query }: AllResultsProps) {
  const data = await fetchAllSearch(query);
  const songs = data ? getSearchItems(data.songs) : [];
  const top =
    data &&
    [data.topquery, data.artists, data.albums, data.songs]
      .map((group) => getSearchItems(group)[0])
      .find(Boolean);

  if (!data || !top) {
    return (
      <LibraryEmpty
        icon={SearchX}
        title="No results found"
        description={`Nothing matched "${query}". Check the spelling or try a different search.`}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
        <section aria-labelledby="search-top-result">
          <h2
            id="search-top-result"
            className={cn("mb-3", searchUi.sectionTitle)}
          >
            Top result
          </h2>
          <TopResultCard item={top} />
        </section>

        {songs.length ? (
          <section aria-labelledby="search-songs">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 id="search-songs" className={searchUi.sectionTitle}>
                Songs
              </h2>
              <Link href={searchHref(query, "song")} className={searchUi.link}>
                See all
              </Link>
            </div>
            {songs.slice(0, 4).map((song) => (
              <SearchRow
                key={song.id}
                href={getSearchItemHref(song)}
                title={song.title}
                subtitle={song.subtitle}
                visual={{ kind: "image", src: song.image, type: song.type }}
              />
            ))}
          </section>
        ) : null}
      </div>

      {SHELVES.map(({ key, title }) => {
        const items = getSearchItems(data[key]);
        return items.length ? (
          <SliderList key={key} title={title} items={items.map(toShelfItem)} />
        ) : null;
      })}
    </div>
  );
}
