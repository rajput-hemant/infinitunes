import { describe, expect, it, mock } from "bun:test";

import { TRPCError } from "@trpc/server";

const calls: { procedure: string; input: unknown }[] = [];
let showAnswer: () => Promise<unknown> = async () => ({});
let episodeAnswer: () => Promise<unknown> = async () => ({});

// The library reads in `lib/db/queries` are server-only.
mock.module("server-only", () => ({}));
mock.module("~/lib/trpc/server", () => ({
  api: {
    show: {
      details: (input: unknown) => {
        calls.push({ procedure: "show.details", input });
        return showAnswer();
      },
      episodeDetails: (input: unknown) => {
        calls.push({ procedure: "show.episodeDetails", input });
        return episodeAnswer();
      },
    },
  },
}));

const { generateMetadata: showMetadata, default: ShowPage } =
  await import("../../app/(root)/show/[name]/[season]/[token]/page");
const { generateMetadata: episodeMetadata, default: EpisodePage } =
  await import("../../app/(root)/episode/[name]/[token]/page");

const notFoundError = () =>
  new TRPCError({ code: "NOT_FOUND", message: "missing" });

/** Next's notFound() signal carries a digest ending in the 404 status. */
function expectNotFound(work: Promise<unknown>) {
  return expect(work).rejects.toMatchObject({
    digest: expect.stringContaining("404"),
  });
}

describe("show detail page", () => {
  const params = Promise.resolve({ name: "x", season: "1", token: "zzzz" });

  it("renders the not-found UI when the show does not exist", async () => {
    showAnswer = () => Promise.reject(notFoundError());
    await expectNotFound(
      ShowPage({ params, searchParams: Promise.resolve({}) }),
    );
  });

  it("renders the not-found UI from generateMetadata too", async () => {
    showAnswer = () => Promise.reject(notFoundError());
    await expectNotFound(
      showMetadata({
        params: Promise.resolve({ name: "x", season: "1", token: "zzzz" }),
        searchParams: Promise.resolve({}),
      }),
    );
  });

  it("does not turn an upstream outage into not-found", async () => {
    showAnswer = () =>
      Promise.reject(new TRPCError({ code: "BAD_GATEWAY", message: "down" }));
    await expect(
      ShowPage({ params, searchParams: Promise.resolve({}) }),
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
  });
});

describe("episode detail page", () => {
  const params = () => Promise.resolve({ name: "x", token: "zzzz" });

  it("renders the not-found UI when the router reports NOT_FOUND", async () => {
    episodeAnswer = () => Promise.reject(notFoundError());
    await expectNotFound(EpisodePage({ params: params() }));
    await expectNotFound(episodeMetadata({ params: params() }));
  });

  it("renders the not-found UI when no episode comes back", async () => {
    episodeAnswer = async () => ({ episodes: [], modules: {} });
    await expectNotFound(EpisodePage({ params: params() }));
    await expectNotFound(episodeMetadata({ params: params() }));
  });

  it("passes the token through to the episode lookup", async () => {
    episodeAnswer = () => Promise.reject(notFoundError());
    calls.length = 0;
    await expectNotFound(EpisodePage({ params: params() }));
    expect(calls.at(-1)).toMatchObject({
      procedure: "show.episodeDetails",
      input: { token: "zzzz" },
    });
  });
});
