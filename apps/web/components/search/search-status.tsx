import type { AllSearch } from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";

export type SearchState =
  | { status: "loading" }
  | { status: "ready"; data: AllSearch }
  | { status: "empty" }
  | { status: "error" };

type SearchQueryError = { data?: { code: string } | null };

/** `search.all` answers NOT_FOUND when nothing matched, which is an empty result, not a failure. */
export function resolveSearchState(
  data: AllSearch | undefined,
  error: SearchQueryError | null | undefined,
): SearchState {
  if (data) return { status: "ready", data };
  if (!error) return { status: "loading" };
  return { status: error.data?.code === "NOT_FOUND" ? "empty" : "error" };
}

function SearchSkeleton() {
  return (
    <output className="block py-1">
      <span className="sr-only">Searching...</span>
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="flex items-center gap-3 px-3 py-1"
        >
          <Skeleton className="size-10 rounded-[calc(var(--r-sm)*0.75)]" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </output>
  );
}

type SearchStatusProps = {
  query: string;
  state: Exclude<SearchState, { status: "ready" }>;
};

/** Loading, empty and error feedback for a combined search. */
export function SearchStatus({ query, state }: SearchStatusProps) {
  if (state.status === "loading") return <SearchSkeleton />;

  return (
    <output className="block px-3 py-6 text-center text-sm text-muted-foreground">
      {state.status === "empty"
        ? `No matches for "${query}". Check the spelling or try another search.`
        : "Search is unavailable right now. Try again in a moment."}
    </output>
  );
}
