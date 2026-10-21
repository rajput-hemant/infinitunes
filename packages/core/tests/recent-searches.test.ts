import { describe, expect, it } from "bun:test";

import {
  addRecentSearch,
  MAX_RECENT_SEARCHES,
  parseRecentSearches,
} from "../src/recent-searches";

describe("addRecentSearch", () => {
  it("moves a repeated query to the front without duplicating it", () => {
    expect(addRecentSearch(["rock", "Jazz", "pop"], "  jazz ")).toEqual([
      "jazz",
      "rock",
      "pop",
    ]);
  });

  it("ignores blank queries and caps the list, dropping the oldest", () => {
    expect(addRecentSearch(["rock"], "   ")).toEqual(["rock"]);

    const full = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => `q${i}`);
    const next = addRecentSearch(full, "new");
    expect(next).toHaveLength(MAX_RECENT_SEARCHES);
    expect(next[0]).toBe("new");
    expect(next).not.toContain(`q${MAX_RECENT_SEARCHES - 1}`);
  });
});

describe("parseRecentSearches", () => {
  it("drops stored values that are not a list of strings", () => {
    expect(parseRecentSearches(null)).toEqual([]);
    expect(parseRecentSearches("not json")).toEqual([]);
    expect(parseRecentSearches('{"a":1}')).toEqual([]);
    expect(parseRecentSearches('["a", 3, "", "b"]')).toEqual(["a", "b"]);
  });
});
