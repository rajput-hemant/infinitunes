import { describe, expect, it } from "bun:test";

import { clientSchema } from "@infinitunes/env/schema";

import { siteConfig } from "../config/site";

describe("siteConfig", () => {
  it("has url defined and defaults to https://infinitunes.rajputhemant.me when unset", () => {
    expect(siteConfig.url).toBe("https://infinitunes.rajputhemant.me");
  });

  it("falls back to the same default as the env schema", () => {
    expect(siteConfig.url).toBe(
      clientSchema.NEXT_PUBLIC_APP_URL.parse(undefined),
    );
  });
});
