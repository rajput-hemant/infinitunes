import { searchUi } from "~/components/search/search-ui";

import { MobileSearch } from "./_components/mobile-search";
import { TopSearches } from "./_components/top-searches";

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
