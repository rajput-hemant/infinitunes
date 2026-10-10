import { describe, expect, it } from "bun:test";

import {
  addRecentSearch,
  MAX_RECENT_SEARCHES,
  parseRecentSearches,
} from "../components/search/recent-searches";
import { resolveSearchState } from "../components/search/search-status";

describe("recent searches", () => {
  it("moves a repeated query to the front without duplicating it", () => {
    expect(addRecentSearch(["rock", "Jazz", "pop"], "  jazz ")).toEqual([
      "jazz",
      "rock",
      "pop",
    ]);
  });

  it("ignores blank queries and caps the list", () => {
    expect(addRecentSearch(["rock"], "   ")).toEqual(["rock"]);

    const full = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => `q${i}`);
    const next = addRecentSearch(full, "new");
    expect(next).toHaveLength(MAX_RECENT_SEARCHES);
    expect(next[0]).toBe("new");
  });

  it("drops stored values that are not a list of strings", () => {
    expect(parseRecentSearches(null)).toEqual([]);
    expect(parseRecentSearches("not json")).toEqual([]);
    expect(parseRecentSearches('{"a":1}')).toEqual([]);
    expect(parseRecentSearches('["a", 3, "", "b"]')).toEqual(["a", "b"]);
  });
});

describe("combined search state", () => {
  it("treats NOT_FOUND as an empty result and other errors as failures", () => {
    expect(resolveSearchState(undefined, undefined)).toEqual({
      status: "loading",
    });
    expect(
      resolveSearchState(undefined, { data: { code: "NOT_FOUND" } }),
    ).toEqual({ status: "empty" });
    expect(
      resolveSearchState(undefined, {
        data: { code: "INTERNAL_SERVER_ERROR" },
      }),
    ).toEqual({ status: "error" });
  });
});
