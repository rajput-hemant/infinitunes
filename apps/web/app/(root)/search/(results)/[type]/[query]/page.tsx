import { notFound } from "next/navigation";
import { Suspense } from "react";

import { decodeSearchQuery } from "~/components/search/search-query";
import { api } from "~/lib/trpc/server";

import { AllResults } from "./_components/all-results";
import { SearchResultsSkeleton } from "./_components/results-skeleton";
import { toSearchPage } from "./_components/search-page";
import { SearchResults } from "./_components/search-results";
import { isSearchType, SEARCH_TYPE_MAP } from "./_components/type-map";

type SearchPageProps = PageProps<"/search/[type]/[query]">;

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
