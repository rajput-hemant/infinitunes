import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "~/lib/persisted-storage";

export const MAX_RECENT_SEARCHES = 6;

/** Puts `query` first, drops any earlier copy (case-insensitive) and caps the list. */
export function addRecentSearch(list: readonly string[], query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [...list];

  const rest = list.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  return [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES);
}

type SearchHistory = { queries: string[] };

type SearchHistoryActions = {
  add: (query: string) => void;
  clear: () => void;
};

/** The listener's recent searches, newest first, kept across launches. */
export const searchHistoryStore = createStore<
  SearchHistory & SearchHistoryActions
>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) =>
        set(({ queries }) => ({ queries: addRecentSearch(queries, query) })),
      clear: () => set({ queries: [] }),
    }),
    {
      name: "recent-searches",
      storage: persistedStorage<SearchHistory>(),
      partialize: ({ queries }) => ({ queries }),
    },
  ),
);

export function useSearchHistory() {
  const queries = useStore(searchHistoryStore, (state) => state.queries);
  const { add, clear } = searchHistoryStore.getState();
  return { queries, add, clear };
}
