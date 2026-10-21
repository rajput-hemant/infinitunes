import { queryClient } from "~/lib/query-client";
import { authClient } from "~/test/session-mock";

import { signOut } from "./end-session";

const FAVORITES_KEY = [["user", "getUserFavorites"], { type: "query" }, "u1"];
const PLAYLISTS_KEY = [["user", "getUserPlaylists"], { type: "query" }, "u1"];
const CATALOG_KEY = [["home", "home"], { type: "query" }];

// The app's own client schedules cache-collection timers that outlive a test.
afterAll(() => queryClient.clear());

beforeEach(() => {
  queryClient.clear();
  queryClient.setQueryData(FAVORITES_KEY, { song: ["a"] });
  queryClient.setQueryData(PLAYLISTS_KEY, []);
  queryClient.setQueryData(CATALOG_KEY, { modules: [] });
});

describe("signOut", () => {
  it("drops the account's cached library but keeps the catalog", async () => {
    await expect(signOut()).resolves.toBeUndefined();

    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(PLAYLISTS_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(CATALOG_KEY)).toEqual({ modules: [] });
  });

  it("keeps everything and reports why when the server call fails", async () => {
    authClient.signOut.mockResolvedValueOnce({ error: { status: 503 } });

    await expect(signOut()).resolves.toEqual({
      message: "Something went wrong. Please try again.",
    });

    expect(queryClient.getQueryData(FAVORITES_KEY)).toEqual({ song: ["a"] });
  });
});
