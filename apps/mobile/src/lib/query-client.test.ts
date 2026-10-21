import { trpcError } from "~/test/trpc-mock";

import { shouldRetry } from "./query-client";

describe("shouldRetry", () => {
  it("retries upstream failures up to three times", () => {
    const upstream = trpcError("BAD_GATEWAY", "upstream");
    expect(shouldRetry(0, upstream)).toBe(true);
    expect(shouldRetry(2, upstream)).toBe(true);
    expect(shouldRetry(3, upstream)).toBe(false);
  });

  it.each(["NOT_FOUND", "BAD_REQUEST", "FORBIDDEN", "UNAUTHORIZED"])(
    "does not retry %s",
    (code) => {
      expect(shouldRetry(0, trpcError(code))).toBe(false);
    },
  );

  it("retries a network failure without a code", () => {
    expect(shouldRetry(0, new TypeError("Network request failed"))).toBe(true);
  });
});
