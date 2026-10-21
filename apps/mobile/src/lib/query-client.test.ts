import { trpcError } from "~/test/trpc-mock";

import { shouldRetry } from "./query-client";

describe("shouldRetry", () => {
  it("retries upstream failures up to three times", () => {
    const upstream = trpcError("BAD_GATEWAY", "upstream");
    expect(shouldRetry(0, upstream)).toBe(true);
    expect(shouldRetry(2, upstream)).toBe(true);
    expect(shouldRetry(3, upstream)).toBe(false);
  });

  it.each([
    "NOT_FOUND",
    "BAD_REQUEST",
    "FORBIDDEN",
    "UNAUTHORIZED",
    "TOO_MANY_REQUESTS",
  ])("does not retry %s", (code) => {
    expect(shouldRetry(0, trpcError(code))).toBe(false);
  });

  it.each([
    [429, false],
    [403, false],
    [502, true],
  ])(
    "reads the proxy's bare %i (no tRPC body): retry %p",
    (status, retried) => {
      // What tRPC's client throws for a response that is not a tRPC error.
      const bare = Object.assign(
        new Error("Unable to transform response from server"),
        { meta: { response: { status } } },
      );
      expect(shouldRetry(0, bare)).toBe(retried);
    },
  );

  it("retries a network failure without a code", () => {
    expect(shouldRetry(0, new TypeError("Network request failed"))).toBe(true);
  });
});
