"use client";

import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@infinitunes/core/react/use-debounced-value";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { QueryScope } from "~/components/query-scope";
import { SearchAll } from "~/components/search/search-all";
import { SearchField } from "~/components/search/search-field";
import { searchHref } from "~/components/search/search-query";
import {
  resolveSearchState,
  SearchStatus,
} from "~/components/search/search-status";
import { searchUi } from "~/components/search/search-ui";
import { useRecentSearches } from "~/components/search/use-recent-searches";
import { controlStyles } from "~/lib/control-styles";
import { trpc } from "~/lib/trpc/vanilla";
import { cn } from "~/lib/utils";

type MobileSearchProps = {
  /** Server-rendered discovery list, shown while the field is empty. */
  topSearches: ReactNode;
};

function MobileSearchContent({ topSearches }: MobileSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS, {
    immediate: "",
  });
  const isIdle = debouncedQuery.length === 0;

  const { recent, add, clear } = useRecentSearches();

  const { data, error } = useQuery({
    queryKey: ["search-all", debouncedQuery],
    queryFn: () => trpc.search.all.query({ q: debouncedQuery }),
    enabled: !isIdle,
    retry: false,
  });

  const results = resolveSearchState(data, error);

  const openResults = (value: string) => {
    add(value);
    router.push(searchHref(value));
  };

  return (
    <div className="space-y-6">
      <search>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) openResults(query);
          }}
        >
          <SearchField
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Songs, albums, artists, podcasts"
          />
        </form>
      </search>

      {isIdle ? (
        <>
          {recent.length ? (
            <section aria-labelledby="recent-searches">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 id="recent-searches" className={searchUi.sectionTitle}>
                  Recent searches
                </h2>
                <button
                  type="button"
                  aria-label="Clear recent searches"
                  onClick={clear}
                  className={searchUi.link}
                >
                  Clear
                </button>
              </div>
              <div className={searchUi.chipsRow}>
                {recent.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => openResults(item)}
                    className={cn(controlStyles.text, searchUi.chip, "px-3")}
                  >
                    <Clock aria-hidden="true" className="size-4" />
                    {item}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {topSearches}
        </>
      ) : results.status === "ready" ? (
        <SearchAll
          query={debouncedQuery}
          data={results.data}
          onSelect={() => add(debouncedQuery)}
        />
      ) : (
        <SearchStatus query={debouncedQuery} state={results} />
      )}
    </div>
  );
}

export function MobileSearch(props: MobileSearchProps) {
  return (
    <QueryScope>
      <MobileSearchContent {...props} />
    </QueryScope>
  );
}
