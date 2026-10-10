"use client";

import type { AllSearch } from "@infinitunes/types";
import React from "react";

import { SearchAll } from "~/components/search/search-all";
import { SearchField } from "~/components/search/search-field";
import LoadingSpinner from "~/components/loading-spinner";
import { useIsTyping } from "~/hooks/use-store";
import { api } from "~/lib/trpc/client";

type MobileSearchProps = {
  topSearch: React.JSX.Element;
};

export function MobileSearch({ topSearch }: MobileSearchProps) {
  const [query, setQuery] = React.useState("");

  const deferredQuery = React.useDeferredValue(query.trim());
  const [_, setIsTyping] = useIsTyping();

  const { data: searchResult, isLoading } = api.search.all.useQuery(
    { q: deferredQuery },
    { enabled: deferredQuery.length > 0 },
  );

  React.useEffect(() => {
    if (deferredQuery.length) setIsTyping(true);
    else setIsTyping(false);
  }, [deferredQuery, setIsTyping]);

  return (
    <>
      <h1 className="sr-only">Search</h1>

      <SearchField
        size="lg"
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Songs, albums, artists, podcasts"
        className="mb-6"
      />

      {!deferredQuery.length && topSearch}

      {isLoading ? (
        <LoadingSpinner size="sm" className="py-10" />
      ) : null}

      {searchResult ? (
        <SearchAll
          query={query}
          data={searchResult as AllSearch}
          showSeeAllLink={false}
        />
      ) : null}
    </>
  );
}
