import { describe, expect, it } from "bun:test";

import { isNavActive } from "../config/nav";

describe("isNavActive", () => {
  it("matches an item on its own path and below it", () => {
    expect(isNavActive("/album", "/album")).toBe(true);
    expect(isNavActive("/album/some-name", "/album")).toBe(true);
    expect(isNavActive("/me/liked-songs", "/me/liked-songs")).toBe(true);
  });

  it("does not match a sibling that shares a prefix", () => {
    expect(isNavActive("/albums", "/album")).toBe(false);
    expect(isNavActive("/me", "/me/liked-songs")).toBe(false);
  });

  it("matches home only on the home route", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/search", "/")).toBe(false);
  });

  it("matches nothing before the pathname is known", () => {
    expect(isNavActive(null, "/")).toBe(false);
  });
});
