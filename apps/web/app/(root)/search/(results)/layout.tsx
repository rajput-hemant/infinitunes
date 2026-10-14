import type { ReactNode } from "react";

import { SearchResultsHeader } from "./[type]/[query]/_components/results-header";

/**
 * Wraps the results routes only (`(results)` is a route group, so the URLs are
 * unchanged). The layout sits above `[type]`, so it persists when the type
 * changes, and the header it renders reads the type and query with `useParams`.
 */
export default function SearchResultsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mb-4 space-y-6">
      <SearchResultsHeader />

      {children}
    </div>
  );
}
