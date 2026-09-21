import { describe, expect, it } from "bun:test";

import { siteConfig } from "../config/site";
import { newPlaylistSchema } from "../lib/validations";

describe("newPlaylistSchema", () => {
  it("accepts valid playlist names with and without description", () => {
    expect(
      newPlaylistSchema.safeParse({
        name: "My Favorite Songs",
      }).success,
    ).toBe(true);

    expect(
      newPlaylistSchema.safeParse({
        name: "Chill Beats",
        description: "Songs to relax to",
      }).success,
    ).toBe(true);
  });

  it("rejects playlist names shorter than 3 characters or longer than 100 characters", () => {
    expect(
      newPlaylistSchema.safeParse({
        name: "ab",
      }).success,
    ).toBe(false);

    expect(
      newPlaylistSchema.safeParse({
        name: "a".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejects descriptions exceeding 255 characters", () => {
    expect(
      newPlaylistSchema.safeParse({
        name: "Valid Name",
        description: "d".repeat(256),
      }).success,
    ).toBe(false);
  });
});

describe("siteConfig", () => {
  it("has url defined and defaults to https://infinitunes.rajputhemant.me when unset", () => {
    expect(siteConfig.url).toBe("https://infinitunes.rajputhemant.me");
  });
});
