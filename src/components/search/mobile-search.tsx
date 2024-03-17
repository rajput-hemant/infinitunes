"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import type { AllSearch } from "@/types";

import { useDebounce } from "@/hooks/use-debounce";
import { searchAll } from "@/lib/jiosaavn-api";
import { Input } from "../ui/input";
import SearchAll from "./search-all";

type Props = {
  topSearch: React.JSX.Element;
};

const MobileSearch = ({ topSearch }: Props) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 1000);
  const [isLoading, setIsLoading] = useState(false);

  const [searchResult, setSearchResult] = useState<AllSearch | null>(null);

  useEffect(() => {
    (async () => {
      if (!debouncedQuery) return setSearchResult(null);
      setIsLoading(true);
      const data = await searchAll(debouncedQuery);
      setIsLoading(false);
      setSearchResult(data);
    })();
  }, [debouncedQuery]);

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
};

export default MobileSearch;
