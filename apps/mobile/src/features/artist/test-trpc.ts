/**
 * `~/lib/trpc` for the entity-detail screens' tests: the user-library fakes
 * of `~/test/trpc-mock` plus the artist procedures, each a `jest.fn` the
 * test scripts per case. Use as `jest.mock("~/lib/trpc", () =>
 * require("~/features/artist/test-trpc"))`.
 */
import { trpc as userTrpc, trpcClient as userClient } from "~/test/trpc-mock";

export type Answer = jest.Mock<Promise<unknown>, [input: unknown]>;

/** One procedure as both `trpc.x.y` (query options, path key) and `trpcClient.x.y` (`query`). */
export function fakeProcedure(path: string, answer: Answer) {
  return {
    queryOptions: (input: unknown) => ({
      queryKey: [path.split("."), { input, type: "query" }],
      queryFn: () => answer(input),
    }),
    pathKey: () => [path.split(".")],
    query: answer,
  };
}

export const artistAnswers = {
  details: jest.fn<Promise<unknown>, [input: unknown]>(),
  songs: jest.fn<Promise<unknown>, [input: unknown]>(),
  albums: jest.fn<Promise<unknown>, [input: unknown]>(),
};

const artist = {
  details: fakeProcedure("artist.details", artistAnswers.details),
  songs: fakeProcedure("artist.songs", artistAnswers.songs),
  albums: fakeProcedure("artist.albums", artistAnswers.albums),
};

export const trpc = { ...userTrpc, artist };
export const trpcClient = { ...userClient, artist };
