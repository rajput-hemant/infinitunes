import { LibraryHeading } from "~/components/library/library-section";
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

  const searchRes = await api.search.byType({
    q: query,
    type: SEARCH_TYPE_MAP[type],
    page: 1,
    n: 50,
  });

  return (
    <div className="mb-4 space-y-4">
      <LibraryHeading
        as="h1"
        title={
          <>
            Search Results for{" "}
            <span className="block md:inline-block">
              &apos;
              <em className="font-bold underline underline-offset-4">
                {query.replaceAll("%20", " ")}
              </em>
              &apos;
            </span>
          </>
        }
        description={`${searchRes.total} Results`}
      />

      <div className="space-y-4 border-t">
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
