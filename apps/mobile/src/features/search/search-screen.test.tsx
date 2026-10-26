import { rawAllSearch, rawTopSearches } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { renderStack } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { searchHistoryStore } from "./search-history";
import { SearchScreen } from "./search-screen";

type SearchBarOptions = {
  onChangeText: (event: { nativeEvent: { text: string } }) => void;
  onSearchButtonPress: (event: { nativeEvent: { text: string } }) => void;
  onCancelButtonPress: () => void;
  placeholder: string;
};

type TreeNode = { type?: string; props?: object; children?: unknown[] };

function findSearchBar(node: unknown): SearchBarOptions | undefined {
  if (!node || typeof node !== "object") return undefined;
  const { type, props, children } = node as TreeNode;
  if (type === "RNSSearchBar") return props as SearchBarOptions;
  for (const child of children ?? []) {
    const found = findSearchBar(child);
    if (found) return found;
  }
  return undefined;
}

/**
 * The native search bar as the header hands it to the platform: its props
 * are the handlers the screen configured (the native side calls them with an
 * event carrying the field's text).
 */
function searchBar(): SearchBarOptions {
  const bar = findSearchBar(screen.toJSON());
  if (!bar) throw new Error("The header has no search bar");
  return bar;
}

const mockFocus = { focused: true };
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useIsFocused: () => mockFocus.focused,
}));

const Search = SearchScreen;

const type = (text: string) =>
  act(async () => searchBar().onChangeText({ nativeEvent: { text } }));

/** Lets the 225ms debounce elapse. */
const debounce = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(300);
  });

beforeEach(() => {
  jest.useFakeTimers();
  mockFocus.focused = true;
  searchHistoryStore.setState({ queries: [] });
  procedure("search.top").mockResolvedValue(rawTopSearches);
  procedure("search.all").mockResolvedValue(rawAllSearch);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("SearchScreen", () => {
  it("configures the native search field", async () => {
    await renderStack({ index: Search });

    expect(searchBar().placeholder).toBe("Songs, albums, artists, podcasts");
  });

  it("opens a ?q= link with that query searched", async () => {
    await renderStack({ index: Search }, "/?q=fa9la");

    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "fa9la" });
    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
  });

  it("uses the first value of a repeated ?q= instead of crashing", async () => {
    await renderStack({ index: Search }, "/?q=fa9la&q=other");

    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "fa9la" });
  });

  it("searches a recent query under All, not the last type chip", async () => {
    procedure("search.byType").mockResolvedValue({
      total: 0,
      start: 0,
      results: [],
    });
    searchHistoryStore.setState({ queries: ["older"] });
    await renderStack({ index: Search });
    await type("fa9la");
    await debounce();
    await fireEvent.press(await screen.findByRole("tab", { name: "Albums" }));
    await type("");
    await debounce();
    procedure("search.all").mockClear();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Search for older" }),
    );
    await debounce();

    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "older" });
  });

  it("does not fetch top searches until its tab is shown", async () => {
    mockFocus.focused = false;
    await renderStack({ index: Search });
    await debounce();

    expect(procedure("search.top")).not.toHaveBeenCalled();
  });

  it("shows top searches until something is typed", async () => {
    await renderStack({ index: Search });
    await debounce();

    expect(await screen.findByText("Rock & Roll")).toBeOnTheScreen();
    expect(procedure("search.all")).not.toHaveBeenCalled();
  });

  it("waits out the debounce, then searches the trimmed text", async () => {
    await renderStack({ index: Search });

    await type("  fa9la ");
    expect(procedure("search.all")).not.toHaveBeenCalled();

    await debounce();

    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "fa9la" });
    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
  });

  it("searches only once for a burst of typing", async () => {
    await renderStack({ index: Search });

    for (const text of ["f", "fa", "fa9", "fa9l"]) {
      await type(text);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(50);
      });
    }
    await debounce();

    expect(procedure("search.all")).toHaveBeenCalledTimes(1);
    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "fa9l" });
  });

  it("goes back to the idle lists at once when the field is emptied", async () => {
    await renderStack({ index: Search });
    await type("fa9la");
    await debounce();
    await screen.findByText("Top Result");

    await type("");

    // No debounce wait: clearing the field must not leave stale results.
    expect(screen.queryByText("Top Result")).toBeNull();
  });

  it("clears the results when the search is cancelled", async () => {
    await renderStack({ index: Search });
    await type("fa9la");
    await debounce();
    await screen.findByText("Top Result");

    await act(async () => searchBar().onCancelButtonPress());

    expect(screen.queryByText("Top Result")).toBeNull();
  });

  it("remembers a query when search is submitted, and not one that was only typed", async () => {
    await renderStack({ index: Search });
    await type("fa9la");
    await debounce();
    expect(searchHistoryStore.getState().queries).toEqual([]);

    await act(async () =>
      searchBar().onSearchButtonPress({ nativeEvent: { text: "fa9la" } }),
    );

    expect(searchHistoryStore.getState().queries).toEqual(["fa9la"]);
  });

  it("searches a recent query again and moves it to the top", async () => {
    searchHistoryStore.setState({ queries: ["older", "fa9la"] });
    await renderStack({ index: Search });

    await fireEvent.press(
      await screen.findByRole("button", { name: "Search for fa9la" }),
    );
    await debounce();

    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "fa9la" });
    expect(searchHistoryStore.getState().queries).toEqual(["fa9la", "older"]);
  });

  it("filters by type from the chips, and keeps the query", async () => {
    procedure("search.byType").mockResolvedValue({
      total: 0,
      start: 0,
      results: [],
    });
    await renderStack({ index: Search });
    await type("fa9la");
    await debounce();
    await screen.findByText("Top Result");

    await fireEvent.press(screen.getByRole("tab", { name: "Albums" }));
    await debounce();

    expect(screen.getByRole("tab", { name: "Albums" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "All" })).not.toBeSelected();
    expect(procedure("search.byType")).toHaveBeenCalledWith(
      expect.objectContaining({ q: "fa9la", type: "albums" }),
    );
  });
});
