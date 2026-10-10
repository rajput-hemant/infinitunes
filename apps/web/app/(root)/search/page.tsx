import { TopSearch } from "~/components/search/top-search";
import { searchUi } from "~/components/search/search-ui";

import { MobileSearch } from "./_components/mobile-search";

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-2 pb-8">
      <header className="px-page">
        <h1 className={searchUi.pageTitle}>Search</h1>
      </header>

      <div className="px-page">
        <MobileSearch topSearch={<TopSearch />} />
      </div>
    </div>
  );
}
