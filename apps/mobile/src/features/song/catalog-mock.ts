/**
 * `~/lib/trpc` for the detail screens' tests (`jest.mock("~/lib/trpc", () =>
 * require("~/features/song/catalog-mock"))`): the shared user-library mock
 * plus the catalog procedures the pages read, each a `jest.fn` in `catalog`.
 * An unmocked procedure rejects, which a secondary shelf shows as no shelf;
 * set answers per test with `mockResolvedValue` / `mockRejectedValue`.
 */
import * as userLibrary from "~/test/trpc-mock";

type Procedure = jest.Mock<Promise<unknown>, [input: unknown]>;

function procedure(): Procedure {
  return jest.fn(async (_input: unknown): Promise<unknown> => {
    throw new Error("No answer set for this procedure");
  });
}

export const catalog = {
  album: {
    details: procedure(),
    recommendations: procedure(),
    sameYear: procedure(),
  },
  playlist: { details: procedure(), recommendations: procedure() },
  song: { details: procedure(), recommendations: procedure() },
  artist: { topSongs: procedure() },
  get: {
    trending: procedure(),
    lyrics: procedure(),
    mix: procedure(),
    actorTopSongs: procedure(),
  },
};

type Catalog = typeof catalog;

/** What `createTRPCOptionsProxy` gives a query procedure: options and a path key. */
function queryProcedure(path: string[], answer: Procedure) {
  return {
    queryOptions: (input: unknown) => ({
      queryKey: [path, { input, type: "query" }],
      queryFn: () => answer(input),
    }),
    pathKey: () => [path],
  };
}

function proxyOf<Router extends keyof Catalog>(router: Router) {
  return Object.fromEntries(
    Object.entries(catalog[router]).map(([name, answer]) => [
      name,
      queryProcedure([router, name], answer),
    ]),
  );
}

export const trpc = {
  ...userLibrary.trpc,
  album: proxyOf("album"),
  playlist: proxyOf("playlist"),
  song: proxyOf("song"),
  artist: proxyOf("artist"),
  get: proxyOf("get"),
};

export const { trpcClient } = userLibrary;

/** A tRPC error as the client throws it for a missing entity. */
export function notFoundError(message = "Not found") {
  return Object.assign(new Error(message), { data: { code: "NOT_FOUND" } });
}
