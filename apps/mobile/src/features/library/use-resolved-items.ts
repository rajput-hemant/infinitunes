import { userMessage } from "@infinitunes/core/user-message";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { userQueryKey, useUserId } from "~/user-data/session";

import type { LibraryList } from "./library-list";

/** Where the saved ids come from: the favorites row, history, a playlist. */
export type IdSource = {
  /** `undefined` while they load. */
  ids: readonly string[] | undefined;
  error?: unknown;
  reload: () => Promise<unknown>;
};

type ResolveOptions<Item> = {
  /** Cache namespace of this list. */
  scope: string;
  source: IdSource;
  /** Looks the ids up upstream; `undefined` when none could be fetched. */
  resolve: (ids: string[]) => Promise<Item[] | undefined>;
};

export const UNAVAILABLE = new Error(
  "The music service isn't answering right now. Try again in a moment.",
);

/**
 * Turns saved ids into the items they name. A new id list (an unlike, a new
 * play) is a new query, and the previous items stay up until it lands, so the
 * list never flashes a skeleton for a one-row change.
 */
export function useResolvedItems<Item>({
  scope,
  source,
  resolve,
}: ResolveOptions<Item>): LibraryList<Item> {
  const userId = useUserId();
  const { ids } = source;

  const query = useQuery({
    queryKey: [...userQueryKey(["library", scope], userId), ids],
    queryFn: async () => {
      const wanted = [...(ids ?? [])];
      if (wanted.length === 0) return { items: [], missing: 0 };
      const items = await resolve(wanted);
      if (!items) throw UNAVAILABLE;
      return { items, missing: wanted.length - items.length };
    },
    enabled: userId !== undefined && ids !== undefined,
    placeholderData: keepPreviousData,
  });

  if (source.error) {
    return {
      status: "error",
      error: source.error,
      retry: () => void source.reload(),
    };
  }
  if (!query.data) {
    return query.isError
      ? {
          status: "error",
          error: query.error,
          retry: () => void query.refetch(),
        }
      : { status: "loading" };
  }
  return {
    status: "ready",
    items: query.data.items,
    missing: query.data.missing,
    refreshing: query.isRefetching,
    refresh: () => {
      void Promise.all([source.reload(), query.refetch()]).then(
        ([, result]) => {
          if (result.isError) toast.error(userMessage(result.error));
        },
      );
    },
  };
}
