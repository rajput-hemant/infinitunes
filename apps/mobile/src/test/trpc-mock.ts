/**
 * `~/lib/trpc` for component tests (`jest.mock("~/lib/trpc", () =>
 * require("~/test/trpc-mock"))`): the user-library procedures the shared
 * rows use, as `jest.fn`s answering like an account with an empty library
 * (no favorites row yet, no playlists). Override per test with
 * `mockResolvedValue`/`mockImplementation`.
 */

const procedureKey = (path: string) => () => [
  path.split("."),
  { type: "query" },
];

export const trpc = {
  user: {
    getUserFavorites: { queryKey: procedureKey("user.getUserFavorites") },
    getUserPlaylists: { queryKey: procedureKey("user.getUserPlaylists") },
  },
};

type FavoriteInput = { type: string; token: string };

export const trpcClient = {
  user: {
    getUserFavorites: {
      query: jest.fn(
        async (): Promise<Record<string, string[]> | undefined> => undefined,
      ),
    },
    getUserPlaylists: { query: jest.fn(async () => []) },
    addToFavorites: { mutate: jest.fn(async (_input: FavoriteInput) => []) },
    removeFromFavorites: {
      mutate: jest.fn(async (_input: FavoriteInput) => []),
    },
  },
};
