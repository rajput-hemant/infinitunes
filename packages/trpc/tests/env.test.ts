import { describe, expect, it } from "bun:test";

import { trpcEnv } from "../src/env";

describe("trpcEnv", () => {
  it("requires JIOSAAVN_DES_KEY", () => {
    expect(() => trpcEnv({ runtimeEnv: {} })).toThrow();
    expect(() => trpcEnv({ runtimeEnv: { JIOSAAVN_DES_KEY: "" } })).toThrow();
  });

  it("returns the key when set", () => {
    expect(
      trpcEnv({ runtimeEnv: { JIOSAAVN_DES_KEY: "abc" } }).JIOSAAVN_DES_KEY,
    ).toBe("abc");
  });

  it("skips validation when SKIP_ENV_VALIDATION is true", () => {
    expect(() =>
      trpcEnv({ runtimeEnv: { SKIP_ENV_VALIDATION: "true" } }),
    ).not.toThrow();
  });
});
