import { searchHistoryStore } from "./search-history";

beforeEach(() => searchHistoryStore.setState({ queries: [] }));

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
