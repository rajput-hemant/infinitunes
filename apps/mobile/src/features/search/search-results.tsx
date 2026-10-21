import type { ReactElement } from "react";

import { AllResults } from "./all-results";
import type { ListSearchType, SearchType } from "./search-types";
import { TypeResults } from "./type-results";

type SearchResultsProps = {
  query: string;
  type: SearchType;
  /** The type chips, rendered at the top of the scrolling results. */
  header: ReactElement;
  onShowType: (type: ListSearchType) => void;
  /** A result was opened or played: the query led somewhere worth remembering. */
  onOpenResult: () => void;
  onSearchArtist: (name: string) => void;
};

/** The results for a non-empty query: the combined search, or one type's list. */
export function SearchResults({
  query,
  type,
  header,
  onShowType,
  onOpenResult,
  onSearchArtist,
}: SearchResultsProps) {
  return type === "all" ? (
    <AllResults
      query={query}
      header={header}
      onShowType={onShowType}
      onOpenResult={onOpenResult}
      onSearchArtist={onSearchArtist}
    />
  ) : (
    <TypeResults
      query={query}
      type={type}
      header={header}
      onOpenResult={onOpenResult}
    />
  );
}
