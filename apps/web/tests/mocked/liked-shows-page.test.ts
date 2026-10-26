import { beforeEach, describe, expect, it, mock } from "bun:test";

const calls: { procedure: string; input: unknown }[] = [];
let podcastTokens: Record<string, string> | undefined;

mock.module("server-only", () => ({}));
mock.module("~/lib/viewer", () => ({ requireUser: async () => ({}) }));
mock.module("~/lib/db/queries", () => ({
  getUserFavorites: async () => ({
    podcasts: ["1", "2"],
    podcastTokens,
  }),
}));
mock.module("~/lib/trpc/server", () => ({
  api: {
    show: {
      episodes: async (input: unknown) => {
        calls.push({ procedure: "show.episodes", input });
        return [{ more_info: { show_url: "https://x.test/show/n/1/OLDTOK" } }];
      },
      details: async (input: unknown) => {
        calls.push({ procedure: "show.details", input });
        return { show_details: {} };
      },
    },
  },
}));
mock.module(
  "../../app/(root)/me/(layout-a)/_components/liked-collection",
  () => ({
    LikedCollection: () => null,
  }),
);

const { default: Page } =
  await import("../../app/(root)/me/(layout-a)/shows/page");

beforeEach(() => {
  calls.length = 0;
});

describe("liked podcasts page", () => {
  it("makes one show.details call when the like stored its token", async () => {
    podcastTokens = { "1": "NEWTOK" };
    const { fetchItem } = (await Page()).props;
    await fetchItem("1");
    expect(calls).toEqual([
      { procedure: "show.details", input: { token: "NEWTOK" } },
    ]);
  });

  it("falls back to episodes then details for a like without a token", async () => {
    podcastTokens = {};
    const { fetchItem } = (await Page()).props;
    await fetchItem("2");
    expect(calls.map((c) => c.procedure)).toEqual([
      "show.episodes",
      "show.details",
    ]);
    expect(calls[1]?.input).toEqual({ token: "OLDTOK" });
  });
});
