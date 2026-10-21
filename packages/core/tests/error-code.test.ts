import { describe, expect, it } from "bun:test";

import { bareResponseStatus, getErrorCode } from "../src/error-code";

describe("getErrorCode", () => {
  it("reads a top-level code", () => {
    expect(getErrorCode({ code: "NOT_FOUND" })).toBe("NOT_FOUND");
  });

  it("reads the tRPC client error.data.code shape", () => {
    expect(getErrorCode({ data: { code: "BAD_GATEWAY" } })).toBe("BAD_GATEWAY");
  });

  it("names the proxy's bare 429 and 403 as tRPC would", () => {
    // What tRPC's client throws when the web proxy limits a call.
    const limited = Object.assign(
      new Error("Unable to transform response from server"),
      { meta: { response: { status: 429 } } },
    );
    expect(getErrorCode(limited)).toBe("TOO_MANY_REQUESTS");
    expect(bareResponseStatus(limited)).toBe(429);
    const forbidden = Object.assign(new Error("x"), {
      meta: { response: { status: 403 } },
    });
    // The proxy's refused origin: final, like tRPC's own FORBIDDEN.
    expect(getErrorCode(forbidden)).toBe("FORBIDDEN");
    // A gateway's page is no answer from the app: no code, so it is retried.
    const gateway = Object.assign(new Error("x"), {
      meta: { response: { status: 502 } },
    });
    expect(getErrorCode(gateway)).toBeUndefined();
    expect(bareResponseStatus(gateway)).toBe(502);
    // A real tRPC error body wins over the transport status.
    expect(
      getErrorCode({
        data: { code: "UNAUTHORIZED" },
        meta: { response: { status: 401 } },
      }),
    ).toBe("UNAUTHORIZED");
    expect(
      bareResponseStatus({
        data: { code: "X" },
        meta: { response: { status: 4 } },
      }),
    ).toBeUndefined();
  });

  it("returns undefined for anything else", () => {
    expect(getErrorCode(new Error("boom"))).toBeUndefined();
    expect(getErrorCode({ data: { code: 5 } })).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
    expect(getErrorCode("NOT_FOUND")).toBeUndefined();
  });
});
