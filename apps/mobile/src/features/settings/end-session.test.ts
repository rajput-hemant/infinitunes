import { failureStore } from "~/lib/failure";
import { queryClient } from "~/lib/query-client";
import { playerStore } from "~/playback/player-store";
import { authClient } from "~/test/session-mock";

import { signOut } from "./end-session";

const FAVORITES_KEY = [["user", "getUserFavorites"], { type: "query" }, "u1"];
const PLAYLISTS_KEY = [["user", "getUserPlaylists"], { type: "query" }, "u1"];
const HISTORY_KEY = ["library", "history-ids", "u1"];
const LIKED_SONGS_KEY = ["library", "liked-songs", "u1", ["a"]];
const CATALOG_KEY = [["home", "home"], { type: "query" }];

// The app's own client schedules cache-collection timers that outlive a test.
afterAll(() => queryClient.clear());

beforeEach(() => {
  failureStore.setState({ current: null });
  queryClient.clear();
  queryClient.setQueryData(FAVORITES_KEY, { song: ["a"] });
  queryClient.setQueryData(PLAYLISTS_KEY, []);
  queryClient.setQueryData(HISTORY_KEY, [{ id: "a" }]);
  queryClient.setQueryData(LIKED_SONGS_KEY, { items: [], missing: 0 });
  queryClient.setQueryData(CATALOG_KEY, { modules: [] });
});

describe("signOut", () => {
  it("drops the account's cached library but keeps the catalog", async () => {
    await expect(signOut()).resolves.toBeUndefined();

    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(PLAYLISTS_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(HISTORY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(LIKED_SONGS_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(CATALOG_KEY)).toEqual({ modules: [] });
  });

  it("empties the queue so the engine and media notification stop", async () => {
    playerStore.setState({
      queue: [{ queueItemId: "q1" } as never],
      started: true,
    });

    await signOut();

    expect(playerStore.getState().queue).toEqual([]);
    expect(playerStore.getState().started).toBe(false);
  });

  it("keeps everything and reports why when the server call fails", async () => {
    authClient.signOut.mockResolvedValueOnce({ error: { status: 503 } });

    await expect(signOut()).resolves.toEqual({
      message: "Something went wrong. Please try again.",
    });

    expect(queryClient.getQueryData(FAVORITES_KEY)).toEqual({ song: ["a"] });
    expect(failureStore.getState().current?.message).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("stays quiet about a failure when the caller opts out", async () => {
    authClient.signOut.mockResolvedValueOnce({ error: { status: 503 } });

    await signOut({ report: false });

    expect(failureStore.getState().current).toBeNull();
  });
});
