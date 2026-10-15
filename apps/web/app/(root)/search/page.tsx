import { searchUi } from "~/components/search/search-ui";
import { pageMetadata } from "~/lib/metadata";

import { MobileSearch } from "./_components/mobile-search";
import { TopSearches } from "./_components/top-searches";

export const metadata = pageMetadata({
  title: "Search",
  description:
    "Search songs, albums, artists, playlists and podcasts on Infinitunes.",
  url: "/search",
});

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className={searchUi.pageTitle}>Search</h1>
      </header>

      <MobileSearch topSearches={<TopSearches />} />
    </div>
  );
}
