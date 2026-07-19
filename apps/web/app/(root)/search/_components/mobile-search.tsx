"use client";

import { Input } from "@infinitunes/ui/components/input";
import { Loader2, Search } from "lucide-react";
import React from "react";

import { SearchAll } from "~/components/search/search-all";
import { useDebounce } from "~/hooks/use-debounce";
import { useIsTyping } from "~/hooks/use-store";
import { api } from "~/lib/trpc/client";
import type { AllSearch } from "~/types";

type MobileSearchProps = {
  topSearch: React.JSX.Element;
};

export function MobileSearch({ topSearch }: MobileSearchProps) {
  const [query, setQuery] = React.useState("");

  const debouncedQuery = useDebounce(query.trim(), 1000);
  const [_, setIsTyping] = useIsTyping();

  const { data: searchResult, isLoading } = api.search.all.useQuery(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  React.useEffect(() => {
    if (debouncedQuery.length) setIsTyping(true);
    else setIsTyping(false);
  }, [debouncedQuery, setIsTyping]);

  return (
    <>
      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-2 top-3 size-4 text-muted-foreground" />

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="pl-8"
        />
      </div>

      {!debouncedQuery.length && topSearch}

      {isLoading && (
        <div className="text-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 inline-block animate-spin" /> Loading Results
        </div>
      )}

      {searchResult && (
        <SearchAll query={query} data={searchResult as AllSearch} />
      )}
    </>
  );
}
