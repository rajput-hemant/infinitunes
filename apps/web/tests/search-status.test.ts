import { describe, expect, it } from "bun:test";

import { resolveSearchState } from "../components/search/search-status";

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
