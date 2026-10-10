import { searchUi } from "~/components/search/search-ui";
import { api } from "~/lib/trpc/server";

import { SearchNavbar } from "./_components/search-navbar";
import { SearchResults } from "./_components/search-results";
import { SEARCH_TYPE_MAP } from "./_components/type-map";

type SearchPageProps = {
  params: Promise<{
    type: "song" | "album" | "playlist" | "artist" | "show";
    query: string;
  }>;
};

export default async function SearchPage({ params }: SearchPageProps) {
  const { query, type } = await params;
  const label = query.replaceAll("%20", " ");

  const searchRes = await api.search.byType({
    q: query,
    type: SEARCH_TYPE_MAP[type],
    page: 1,
    n: 50,
  });

  return (
    <div className="mb-4 space-y-6">
      <header className="space-y-1">
        <h1 className={searchUi.pageTitle}>
          Results for &quot;{label}&quot;
        </h1>
        <p className="text-sm text-muted-foreground">
          {searchRes.total} results
        </p>
      </header>

      <div className="space-y-6">
        <SearchNavbar type={type} query={query} />
        <SearchResults
          type={type}
          query={query}
          initialSearchResults={searchRes}
        />
      </div>
    </div>
  );
}
