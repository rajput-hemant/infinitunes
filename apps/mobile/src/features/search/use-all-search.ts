import { getErrorCode } from "@infinitunes/core/error-code";
import type { AllSearch } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

import { getSearchItems } from "./search-items";
import type { SearchItem } from "./search-items";

/** Groups the top result is taken from, most relevant first. */
const TOP_RESULT_GROUPS = ["topquery", "artists", "albums", "songs"] as const;

export type AllSearchState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "empty" }
  | { status: "ready"; data: AllSearch; top: SearchItem };

function topResultOf(data: AllSearch): SearchItem | undefined {
  return TOP_RESULT_GROUPS.map((key) => getSearchItems(data[key])[0]).find(
    Boolean,
  );
}

/**
 * The combined search for `query`. `search.all` answers `null` (or NOT_FOUND)
 * when nothing matched, which is an empty result, not a failure.
 */
export function useAllSearch(query: string) {
  const { data, error, isPending, refetch } = useQuery(
    trpc.search.all.queryOptions({ q: query }),
  );

  const state = resolve(data, error, isPending);
  return { state, retry: () => void refetch() };
}

function resolve(
  data: AllSearch | null | undefined,
  error: unknown,
  isPending: boolean,
): AllSearchState {
  if (error) {
    return getErrorCode(error) === "NOT_FOUND"
      ? { status: "empty" }
      : { status: "error", error };
  }
  if (isPending) return { status: "loading" };
  const top = data ? topResultOf(data) : undefined;
  return data && top ? { status: "ready", data, top } : { status: "empty" };
}
