import { beforeAll, describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

process.env.JIOSAAVN_DES_KEY ??= "38346591";

/** Upstream answers keyed by the `type` query value the show routes send. */
let responses: Record<string, unknown> = {};

let seq = 0;
const uniq = () => `show-${++seq}`;

async function createTestCaller() {
  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  return createCallerFactory(appRouter)({ db, session: null });
}

let caller: Awaited<ReturnType<typeof createTestCaller>>;

beforeAll(async () => {
  globalThis.fetch = async (input) => {
    const type = new URL(String(input)).searchParams.get("type") ?? "";
    if (!(type in responses)) {
      throw new Error(`unexpected upstream type: ${type}`);
    }
    return new Response(JSON.stringify(responses[type]), { status: 200 });
  };

  caller = await createTestCaller();
});

describe("show.details", () => {
  it("throws NOT_FOUND for the upstream failure answer to an unknown token", async () => {
    responses = {
      show: { status: "failure", message: "season not available" },
    };
    await expect(
      caller.show.details({ token: uniq(), season: 1, sort: "desc" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns a show that carries show_details", async () => {
    responses = { show: { show_details: { id: "42", title: "Show" } } };
    const show = await caller.show.details({
      token: uniq(),
      season: 1,
      sort: "desc",
    });
    expect(show.show_details).toMatchObject({ id: "42" });
  });
});

describe("show.episodeDetails", () => {
  it("throws NOT_FOUND when upstream returns no episodes", async () => {
    responses = { episode: { episodes: [] } };
    await expect(
      caller.show.episodeDetails({ token: uniq(), season: 1, sort: "desc" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NOT_FOUND for the empty placeholder episode of an unknown token", async () => {
    responses = { episode: { episodes: [{ id: "", title: "" }] } };
    await expect(
      caller.show.episodeDetails({ token: uniq(), season: 1, sort: "desc" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the episode when upstream identifies it", async () => {
    responses = {
      episode: { episodes: [{ id: "7", title: "Ep" }], modules: {} },
    };
    const detail = await caller.show.episodeDetails({
      token: uniq(),
      season: 1,
      sort: "desc",
    });
    expect(detail.episodes[0]).toMatchObject({ id: "7" });
  });
});
