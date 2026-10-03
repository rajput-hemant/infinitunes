import { describe, expect, it } from "bun:test";

import { TRPCError } from "@trpc/server";

import { userMessage } from "../lib/user-message";

const GENERIC = "Something went wrong. Please try again.";

describe("userMessage", () => {
  it("keeps messages written for the user", () => {
    for (const code of [
      "CONFLICT",
      "BAD_REQUEST",
      "NOT_FOUND",
      "UNAUTHORIZED",
    ] as const) {
      expect(userMessage(new TRPCError({ code, message: "Name taken" }))).toBe(
        "Name taken",
      );
    }
  });

  it("hides upstream and internal failures", () => {
    for (const code of [
      "BAD_GATEWAY",
      "TIMEOUT",
      "INTERNAL_SERVER_ERROR",
    ] as const) {
      expect(
        userMessage(new TRPCError({ code, message: "ECONNRESET 10.0.0.1" })),
      ).toBe(GENERIC);
    }
  });

  it("reads the code from a TRPCClientError-shaped error", () => {
    const error = Object.assign(new Error("db down"), {
      data: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(userMessage(error)).toBe(GENERIC);
  });

  it("keeps a code-less message but not Next's masked one", () => {
    expect(userMessage(new Error("Playlist not found"))).toBe(
      "Playlist not found",
    );
    expect(
      userMessage(
        new Error(
          "An error occurred in the Server Components render. The specific message is omitted in production builds",
        ),
      ),
    ).toBe(GENERIC);
  });

  it("falls back for non-errors and uses a custom fallback", () => {
    expect(userMessage(undefined)).toBe(GENERIC);
    expect(userMessage(null, "Could not rename")).toBe("Could not rename");
  });
});
