"use client";

import React from "react";
import { Loader2, Search } from "lucide-react";

import type { AllSearch } from "@/types";

import { SearchAll } from "@/components/search/search-all";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsTyping } from "@/hooks/use-store";
import { searchAll } from "@/lib/jiosaavn-api";

type MobileSearchProps = {
  topSearch: React.JSX.Element;
};

export function MobileSearch({ topSearch }: MobileSearchProps) {
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchResult, setSearchResult] = React.useState<AllSearch | null>(
    null
  );

  const debouncedQuery = useDebounce(query.trim(), 1000);
  const [_, setIsTyping] = useIsTyping();

  React.useEffect(() => {
    (async () => {
      if (!debouncedQuery) return setSearchResult(null);
      setIsLoading(true);
      const data = await searchAll(debouncedQuery);
      setIsLoading(false);
      setSearchResult(data);
    })();
  }, [debouncedQuery]);

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

      {searchResult && <SearchAll query={query} data={searchResult} />}
    </>
  );
}
