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
  onSearchArtist: (name: string) => void;
};

/** The results for a non-empty query: the combined search, or one type's list. */
export function SearchResults({
  query,
  type,
  header,
  onShowType,
  onSearchArtist,
}: SearchResultsProps) {
  return type === "all" ? (
    <AllResults
      query={query}
      header={header}
      onShowType={onShowType}
      onSearchArtist={onSearchArtist}
    />
  ) : (
    <TypeResults query={query} type={type} header={header} />
  );
}
