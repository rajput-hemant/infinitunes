import {
  addRecentSearch,
  MAX_RECENT_SEARCHES,
  searchHistoryStore,
} from "./search-history";

beforeEach(() => searchHistoryStore.setState({ queries: [] }));

describe("addRecentSearch", () => {
  it("puts the newest first and ignores blank queries", () => {
    expect(addRecentSearch(["arijit"], "  lofi  ")).toEqual(["lofi", "arijit"]);
    expect(addRecentSearch(["arijit"], "   ")).toEqual(["arijit"]);
  });

  it("moves a repeated query to the front, whatever its case", () => {
    expect(addRecentSearch(["lofi", "Arijit"], "arijit")).toEqual([
      "arijit",
      "lofi",
    ]);
  });

  it("keeps only the most recent few", () => {
    const full = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => `q${i}`);

    const next = addRecentSearch(full, "new");

    expect(next).toHaveLength(MAX_RECENT_SEARCHES);
    expect(next[0]).toBe("new");
    expect(next).not.toContain(`q${MAX_RECENT_SEARCHES - 1}`);
  });
});

describe("search history store", () => {
  it("records searches and clears them", () => {
    const { add, clear } = searchHistoryStore.getState();

    add("lofi");
    add("arijit");
    expect(searchHistoryStore.getState().queries).toEqual(["arijit", "lofi"]);

    clear();
    expect(searchHistoryStore.getState().queries).toEqual([]);
  });
});
