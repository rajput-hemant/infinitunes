"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";

import { decodeSearchQuery } from "~/components/search/search-query";
import { searchUi } from "~/components/search/search-ui";

import { SearchResultsHeaderSkeleton } from "./results-skeleton";
import { SearchNavbar } from "./search-navbar";
import { isSearchType } from "./type-map";

function ResultsHeaderContent() {
  const { type, query: segment } = useParams<{
    type?: string;
    query?: string;
  }>();
  if (!type || !segment || !isSearchType(type)) return null;

  const query = decodeSearchQuery(segment);

  return (
    <>
      <header className="pt-2">
        <h1 className={searchUi.pageTitle}>Results for &quot;{query}&quot;</h1>
      </header>

      <SearchNavbar type={type} query={query} />
    </>
  );
}

/**
 * The title and the type chips. They live in the search layout, above the
 * `[type]` segment, so switching between All, Songs, Albums and so on keeps them
 * mounted (the active chip just moves) while only the results below change.
 */
export function SearchResultsHeader() {
  return (
    <Suspense fallback={<SearchResultsHeaderSkeleton />}>
      <ResultsHeaderContent />
    </Suspense>
  );
}
