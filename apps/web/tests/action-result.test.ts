import { describe, expect, it } from "bun:test";

import { userMessage } from "@infinitunes/core/user-message";
import { TRPCError } from "@trpc/server";

import { toResult, unwrap } from "../lib/action-result";

const GENERIC = "Something went wrong. Please try again.";

describe("toResult", () => {
  it("wraps values as ok results", async () => {
    await expect(toResult(async () => 42)).resolves.toEqual({
      ok: true,
      data: 42,
    });
  });

  it("maps coded failures to safe results without throwing", async () => {
    await expect(
      toResult(async () => {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "upstream connect ECONNREFUSED 10.0.0.1",
        });
      }),
    ).resolves.toEqual({
      ok: false,
      code: "BAD_GATEWAY",
      message: GENERIC,
    });
  });

  it("keeps user-caused copy with its code", async () => {
    await expect(
      toResult(async () => {
        throw new TRPCError({ code: "NOT_FOUND", message: "Playlist gone" });
      }),
    ).resolves.toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: "Playlist gone",
    });
  });
});

describe("unwrap", () => {
  it("resolves ok values for the success toast path", async () => {
    await expect(
      unwrap(Promise.resolve({ ok: true, data: { name: "Mix" } })),
    ).resolves.toEqual({ name: "Mix" });
  });

  it("throws a coded error the toast mapper understands", async () => {
    const failure = unwrap(
      toResult(async () => {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Name taken",
        });
      }),
    );
    await expect(failure).rejects.toThrow("Name taken");
    const error = await failure.catch((e) => e);
    expect(userMessage(error)).toBe("Name taken");
  });

  it("keeps upstream failures generic after unwrapping", async () => {
    const error = await unwrap(
      toResult(async () => {
        throw new TRPCError({
          code: "TIMEOUT",
          message: "upstream slow",
        });
      }),
    ).catch((e) => e);
    expect(userMessage(error)).toBe(GENERIC);
  });
});

describe("server action results", () => {
  it("keeps friendly sign-in copy across the action boundary", async () => {
    const failed = await toResult(async () => {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    });
    expect(failed).toEqual({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Please sign in to continue.",
    });
    const error = await unwrap(Promise.resolve(failed)).catch((e) => e);
    expect(userMessage(error)).toBe("Please sign in to continue.");
  });

  it("round-trips a tRPC code across the action boundary", async () => {
    const failed = await toResult(async () => {
      throw new TRPCError({ code: "CONFLICT", message: "Name taken" });
    });
    expect(failed).toEqual({
      ok: false,
      code: "CONFLICT",
      message: "Name taken",
    });
    const error = await unwrap(Promise.resolve(failed)).catch((e) => e);
    expect(userMessage(error)).toBe("Name taken");
  });

  it("never sends internal messages and maps uncoded errors to UNKNOWN", async () => {
    const failed = await toResult(async () => {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "pg: down",
      });
    });
    expect(failed).toMatchObject({ ok: false, message: GENERIC });
    await expect(
      toResult(async () => {
        throw new Error("boom");
      }),
    ).resolves.toMatchObject({ ok: false, code: "UNKNOWN", message: GENERIC });
    await expect(
      toResult(async () => {
        throw Object.assign(new Error("NEXT_REDIRECT"), {
          digest: "NEXT_REDIRECT;replace;/login;307;",
        });
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});
