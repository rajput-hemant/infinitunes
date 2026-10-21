import { EmptyState } from "~/components/empty-state";

/** Nothing matched: a result, not a failure. */
export function NoResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={{ ios: "magnifyingglass", android: "search_off" }}
      title="No results found"
      message={`Nothing matched "${query}". Check the spelling or try a different search.`}
    />
  );
}
