"use client";

import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useDeferredValue, useEffect, useState } from "react";

import { SearchAll } from "~/components/search/search-all";
import { SearchField } from "~/components/search/search-field";
import { searchHref } from "~/components/search/search-query";
import {
  resolveSearchState,
  SearchStatus,
} from "~/components/search/search-status";
import { searchUi } from "~/components/search/search-ui";
import { useRecentSearches } from "~/components/search/use-recent-searches";
import { useIsTyping } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { api } from "~/lib/trpc/client";
import { cn } from "~/lib/utils";

type MobileSearchProps = {
  /** Server-rendered discovery list, shown while the field is empty. */
  topSearches: ReactNode;
};

export function MobileSearch({ topSearches }: MobileSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const isIdle = deferredQuery.length === 0;

  const [, setIsTyping] = useIsTyping();
  const { recent, add, clear } = useRecentSearches();

  const { data, error } = api.search.all.useQuery(
    { q: deferredQuery },
    { enabled: !isIdle, retry: false },
  );

  const results = resolveSearchState(data, error);

  useEffect(() => {
    setIsTyping(!isIdle);
  }, [isIdle, setIsTyping]);

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
                <button type="button" onClick={clear} className={searchUi.link}>
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
          query={deferredQuery}
          data={results.data}
          onSelect={() => add(deferredQuery)}
        />
      ) : (
        <SearchStatus query={deferredQuery} state={results} />
      )}
    </div>
  );
}
