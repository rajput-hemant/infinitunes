import { describe, expect, it } from "bun:test";

import { dbEnv } from "../src/env";

describe("dbEnv", () => {
  it("requires DATABASE_URL", () => {
    expect(() => dbEnv({ runtimeEnv: {} })).toThrow();
    expect(() => dbEnv({ runtimeEnv: { DATABASE_URL: "" } })).toThrow();
  });

  it("returns DATABASE_URL when set", () => {
    const env = dbEnv({ runtimeEnv: { DATABASE_URL: "postgres://x/y" } });
    expect(env.DATABASE_URL).toBe("postgres://x/y");
  });

  it("skips validation when SKIP_ENV_VALIDATION is true", () => {
    expect(() =>
      dbEnv({ runtimeEnv: { SKIP_ENV_VALIDATION: "true" } }),
    ).not.toThrow();
  });
});
