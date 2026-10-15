import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  decodeSearchQuery,
  searchHref,
} from "~/components/search/search-query";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

import { AllResults } from "./_components/all-results";
import { SearchResultsSkeleton } from "./_components/results-skeleton";
import { toSearchPage } from "./_components/search-page";
import { SearchResults } from "./_components/search-results";
import {
  isSearchType,
  SEARCH_TYPE_MAP,
  type SearchType,
} from "./_components/type-map";

type SearchPageProps = PageProps<"/search/[type]/[query]">;

const RESULT_LABELS: Record<SearchType, string> = {
  all: "Search results",
  song: "Songs",
  album: "Albums",
  playlist: "Playlists",
  artist: "Artists",
  show: "Podcasts",
};

/**
 * No upstream call here: the title and canonical come from the URL alone, so
 * the results stream without waiting on metadata.
 */
export async function generateMetadata({
  params,
}: Pick<SearchPageProps, "params">): Promise<Metadata> {
  const { type, query: segment } = await params;
  if (!isSearchType(type)) return {};

  const query = decodeSearchQuery(segment);
  const label = RESULT_LABELS[type];

  return pageMetadata({
    title: `${label} for ${query}`,
    description: `${label} matching "${query}" on Infinitunes.`,
    url: searchHref(query, type),
  });
}

async function Results({ params }: Pick<SearchPageProps, "params">) {
  const { type, query: segment } = await params;
  if (!isSearchType(type)) notFound();

  const query = decodeSearchQuery(segment);

  return type === "all" ? (
    <AllResults query={query} />
  ) : (
    <SearchResults
      type={type}
      query={query}
      initialPage={toSearchPage(
        await api.search.byType({
          q: query,
          type: SEARCH_TYPE_MAP[type],
          page: 1,
          n: 50,
        }),
      )}
    />
  );
}

/** Only the results suspend; the layout's title and type chips stay put. */
export default function SearchPage({ params }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <Results params={params} />
    </Suspense>
  );
}
