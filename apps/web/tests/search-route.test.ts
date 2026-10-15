import { describe, expect, it } from "bun:test";

import {
  decodeSearchQuery,
  searchHref,
} from "../components/search/search-query";
import { safeSearchSegment, searchRouteAction } from "../lib/search-route";

describe("search query round trip", () => {
  for (const query of [
    "50%",
    "%",
    "a%b",
    "100%41",
    "a b",
    "rock & roll",
    "50%25",
  ]) {
    it(`survives two decodes: ${query}`, () => {
      const segment = String(searchHref(query)).split("/").pop() ?? "";
      // Next decodes once before matching, and the matcher decodes again.
      expect(() =>
        decodeURIComponent(decodeURIComponent(segment)),
      ).not.toThrow();
      expect(decodeSearchQuery(segment)).toBe(query);
    });
  }
});

describe("searchRouteAction", () => {
  it("repairs a literal percent typed straight into the URL", () => {
    expect(searchRouteAction("/search/all/50%25")).toEqual({
      kind: "rewrite",
      pathname: "/search/all/50%2525",
    });
    expect(searchRouteAction("/search/all/50%")).toEqual({
      kind: "rewrite",
      pathname: "/search/all/50%2525",
    });
    expect(decodeSearchQuery("50%2525")).toBe("50%");
  });

  it("lets well-formed queries through", () => {
    expect(searchRouteAction("/search/all/love")).toBeNull();
    expect(searchRouteAction("/search/song/a%20b")).toBeNull();
    expect(searchRouteAction("/search/all/50%2525")).toBeNull();
    expect(searchRouteAction("/search")).toBeNull();
    expect(searchRouteAction("/album/x/y")).toBeNull();
  });

  it("redirects plural types to the singular", () => {
    expect(searchRouteAction("/search/songs/love")).toEqual({
      kind: "redirect",
      pathname: "/search/song/love",
    });
    expect(searchRouteAction("/search/shows/love")?.kind).toBe("redirect");
  });

  it("404s unknown types", () => {
    expect(searchRouteAction("/search/bogus/love")).toEqual({
      kind: "notFound",
    });
    expect(searchRouteAction("/search/constructor/love")).toEqual({
      kind: "notFound",
    });
  });

  it("gives up on an unrepairable segment", () => {
    expect(safeSearchSegment("%E0%A4")).toBeNull();
  });
});
