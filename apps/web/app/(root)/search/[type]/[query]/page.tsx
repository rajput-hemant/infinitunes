import { notFound } from "next/navigation";

import { decodeSearchQuery } from "~/components/search/search-query";
import { searchUi } from "~/components/search/search-ui";
import { api } from "~/lib/trpc/server";

import { AllResults } from "./_components/all-results";
import { SearchNavbar } from "./_components/search-navbar";
import { SearchResults } from "./_components/search-results";
import { isSearchType, SEARCH_TYPE_MAP } from "./_components/type-map";

type SearchPageProps = {
  params: Promise<{ type: string; query: string }>;
};

export default async function SearchPage({ params }: SearchPageProps) {
  const { type, query: segment } = await params;
  if (!isSearchType(type)) notFound();
  const query = decodeSearchQuery(segment);

  return (
    <div className="mb-4 space-y-6">
      <header className="pt-2">
        <h1 className={searchUi.pageTitle}>Results for &quot;{query}&quot;</h1>
      </header>

      <SearchNavbar type={type} query={query} />

      {type === "all" ? (
        <AllResults query={query} />
      ) : (
        <SearchResults
          type={type}
          query={query}
          initialSearchResults={await api.search.byType({
            q: query,
            type: SEARCH_TYPE_MAP[type],
            page: 1,
            n: 50,
          })}
        />
      )}
    </div>
  );
}
