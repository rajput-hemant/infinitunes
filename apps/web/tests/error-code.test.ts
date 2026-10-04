import { describe, expect, it } from "bun:test";

import { TRPCError } from "@trpc/server";

import {
  getErrorCode,
  stripActionCode,
  toActionError,
  withActionCode,
} from "../lib/error-code";

describe("getErrorCode", () => {
  it("reads direct, nested, and action-boundary codes", () => {
    expect(
      getErrorCode(new TRPCError({ code: "NOT_FOUND", message: "gone" })),
    ).toBe("NOT_FOUND");
    expect(
      getErrorCode(
        Object.assign(new Error("db down"), {
          data: { code: "INTERNAL_SERVER_ERROR" },
        }),
      ),
    ).toBe("INTERNAL_SERVER_ERROR");
    expect(getErrorCode(new Error("[TIMEOUT] upstream slow"))).toBe("TIMEOUT");
  });

  it("prefers direct and nested codes over the message prefix", () => {
    expect(
      getErrorCode(
        Object.assign(new Error("[TIMEOUT] upstream slow"), {
          code: "CONFLICT",
        }),
      ),
    ).toBe("CONFLICT");
    expect(getErrorCode(new Error("plain message"))).toBeUndefined();
    expect(getErrorCode(new Error("[lowercase] nope"))).toBeUndefined();
    expect(getErrorCode(undefined)).toBeUndefined();
  });
});

describe("toActionError", () => {
  it("embeds the code so it survives as a plain Error", () => {
    const rewrapped = toActionError(
      new TRPCError({ code: "BAD_GATEWAY", message: "upstream down" }),
    );
    expect(rewrapped).toBeInstanceOf(Error);
    expect(rewrapped).not.toHaveProperty("code");
    expect(getErrorCode(rewrapped)).toBe("BAD_GATEWAY");
    expect(stripActionCode(rewrapped.message)).toBe("upstream down");
  });

  it("keeps code-less messages unchanged", () => {
    expect(toActionError(new Error("boom")).message).toBe("boom");
  });
});

describe("withActionCode", () => {
  it("passes values through and rewraps failures", async () => {
    await expect(withActionCode(async () => 42)).resolves.toBe(42);
    const failure = withActionCode(async () => {
      throw new TRPCError({ code: "CONFLICT", message: "Name taken" });
    });
    await expect(failure).rejects.toThrow("[CONFLICT] Name taken");
    await expect(failure).rejects.toMatchObject({
      message: "[CONFLICT] Name taken",
    });
  });
});
