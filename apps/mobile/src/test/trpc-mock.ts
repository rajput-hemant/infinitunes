/**
 * `~/lib/trpc` for component tests (`jest.mock("~/lib/trpc", () =>
 * require("~/test/trpc-mock"))`): the user-library queries the shared rows
 * read, answering with what a signed-in listener with an empty library gets.
 */

function query<Output>(path: string, output: Output) {
  return {
    queryKey: () => [path],
    queryOptions: () => ({
      queryKey: [path],
      queryFn: () => Promise.resolve(output),
    }),
  };
}

export const trpc = {
  user: {
    getUserFavorites: query("user.getUserFavorites", undefined),
    getUserPlaylists: query("user.getUserPlaylists", []),
  },
};

export const trpcClient = {};
