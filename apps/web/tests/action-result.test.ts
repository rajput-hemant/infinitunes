import { describe, expect, it } from "bun:test";

import { TRPCError } from "@trpc/server";

import { actionResult, unwrapAction } from "../lib/action-result";
import { userMessage } from "../lib/user-message";

const GENERIC = "Something went wrong. Please try again.";

describe("actionResult", () => {
  it("wraps values as ok results", async () => {
    await expect(actionResult(async () => 42)).resolves.toEqual({
      ok: true,
      value: 42,
    });
  });

  it("maps coded failures to safe results without throwing", async () => {
    await expect(
      actionResult(async () => {
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
      actionResult(async () => {
        throw new TRPCError({ code: "NOT_FOUND", message: "Playlist gone" });
      }),
    ).resolves.toEqual({
      ok: false,
      code: "NOT_FOUND",
      message: "Playlist gone",
    });
  });
});

describe("unwrapAction", () => {
  it("resolves ok values for the success toast path", async () => {
    await expect(
      unwrapAction(Promise.resolve({ ok: true, value: { name: "Mix" } })),
    ).resolves.toEqual({ name: "Mix" });
  });

  it("throws a coded error the toast mapper understands", async () => {
    const failure = unwrapAction(
      actionResult(async () => {
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
    const error = await unwrapAction(
      actionResult(async () => {
        throw new TRPCError({
          code: "TIMEOUT",
          message: "upstream slow",
        });
      }),
    ).catch((e) => e);
    expect(userMessage(error)).toBe(GENERIC);
  });
});
