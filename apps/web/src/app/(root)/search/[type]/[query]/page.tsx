import { search } from "@/lib/jiosaavn-api";
import { SearchNavbar } from "./_components/search-navbar";
import { SearchResults } from "./_components/search-results";

type SearchPageProps = {
  params: Promise<{
    type: "song" | "album" | "playlist" | "artist" | "show";
    query: string;
  }>;
};

export default async function SearchPage({ params }: SearchPageProps) {
  const { query, type } = await params;

  const searchRes = await search(query, type);

  return (
    <div className="mb-4 space-y-4">
      <header>
        <h1 className="text-center font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-start md:text-4xl">
          Search Results for{" "}
          <span className="block md:inline-block">
            &apos;
            <em className="font-bold underline underline-offset-4">
              {query.replaceAll("%20", " ")}
            </em>
            &apos;
          </span>
        </h1>

        <p className="text-center text-sm text-muted-foreground md:text-start">
          {searchRes.total} Results
        </p>
      </header>

      <main className="space-y-4 border-t">
        <SearchNavbar type={type} query={query} />
        <SearchResults
          type={type}
          query={query}
          initialSearchResults={searchRes}
        />
      </main>
    </div>
  );
}
