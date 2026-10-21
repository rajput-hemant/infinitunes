import { addRecentSearch } from "@infinitunes/core/recent-searches";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedStorage } from "~/lib/persisted-storage";

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
