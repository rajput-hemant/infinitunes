import { Clock, Search } from "lucide-react";
import type { ReactNode } from "react";

import { SearchAll } from "./search-all";
import { SearchGoTo } from "./search-go-to";
import { searchHref } from "./search-query";
import { SearchRow } from "./search-row";
import type { SearchState } from "./search-status";
import { SearchStatus } from "./search-status";
import { searchUi } from "./search-ui";

type SearchPaletteBodyProps = {
  query: string;
  listboxId: string;
  results: SearchState;
  recent: readonly string[];
  /** Server-rendered idle group (trending searches). */
  topSearch: ReactNode;
  onSelect: () => void;
};

export function SearchPaletteBody(props: SearchPaletteBodyProps) {
  const { query, listboxId, results, recent, topSearch, onSelect } = props;
  const recentLabelId = `${listboxId}-recent`;
  const goToLabelId = `${listboxId}-go-to`;

  return (
    <div className="p-2">
      <div
        id={listboxId}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- combobox listbox of link options, no native element fits
        role="listbox"
        aria-label={query ? "Search results" : "Suggestions"}
        aria-busy={results.status === "loading"}
      >
        {query ? (
          <>
            <SearchRow
              option
              href={searchHref(query)}
              title={`Search for "${query}"`}
              subtitle="See all results"
              visual={{ kind: "icon", icon: Search }}
              onSelect={onSelect}
            />
            {results.status === "ready" ? (
              <SearchAll
                variant="palette"
                query={query}
                data={results.data}
                onSelect={onSelect}
              />
            ) : null}
          </>
        ) : (
          <>
            {recent.length ? (
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- listbox option group, no native element fits
              <div role="group" aria-labelledby={recentLabelId}>
                <div id={recentLabelId} className={searchUi.groupLabel}>
                  Recent searches
                </div>
                {recent.map((item) => (
                  <SearchRow
                    key={item}
                    option
                    href={searchHref(item)}
                    title={item}
                    subtitle="Search"
                    visual={{ kind: "icon", icon: Clock }}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ) : null}
            {topSearch}
            <SearchGoTo labelId={goToLabelId} onSelect={onSelect} />
          </>
        )}
      </div>

      {query && results.status !== "ready" ? (
        <SearchStatus query={query} state={results} />
      ) : null}
    </div>
  );
}
