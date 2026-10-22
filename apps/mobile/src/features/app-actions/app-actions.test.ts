import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { waitFor } from "@testing-library/react-native";

import { failureStore } from "~/lib/failure";
import { queryClient } from "~/lib/query-client";
import { playAll } from "~/playback/play-collection";
import { playerStore } from "~/playback/player-store";
import { procedure, trpcError } from "~/test/trpc-mock";
import { deferred, favoritesRow, userPlaylist } from "~/test/user-library";

import { runAppAction } from "./app-actions";

const initial = playerStore.getState();
const context = { userId: "alice", id: "pl-1", q: "song" };
const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);
const searchResult = (id: string) => ({
  total: 1,
  start: 1,
  results: [rawSong({ id })],
});

beforeEach(() => {
  playerStore.setState(initial, true);
  queryClient.clear();
});
afterEach(() => queryClient.clear());

describe.each(["play-liked", "shuffle-liked", "play-playlist"] as const)(
  "%s",
  (action) => {
    beforeEach(() => {
      procedure("user.getUserFavorites").mockResolvedValue(
        favoritesRow({ songs: ["older"] }),
      );
      procedure("user.getPlaylistDetails").mockResolvedValue(
        userPlaylist({ songs: ["older"] }),
      );
    });

    it.each(["resolve", "empty", "reject"] as const)(
      "discards a superseded song lookup that settles with %s",
      async (settle) => {
        const older = deferred<{ songs: ReturnType<typeof rawSong>[] }>();
        const details = procedure("song.details");
        details.mockReturnValueOnce(older.promise);
        const pending = runAppAction(action, context);
        await waitFor(() => expect(details).toHaveBeenCalled());
        playAll([toSongRow(rawSong({ id: "chosen" }))]);

        if (settle === "reject") older.reject(new Error("down"));
        else
          older.resolve({
            songs: settle === "empty" ? [] : [rawSong({ id: "older" })],
          });
        const outcome = await pending;

        expect(queuedIds()).toEqual(["chosen"]);
        expect(failureStore.getState().current).toBeNull();
        expect(outcome).toBe("back");
      },
    );
  },
);

it.each(["missing", "reject"] as const)(
  "ignores a superseded playlist library lookup that returns %s",
  async (settle) => {
    const playlists = deferred<ReturnType<typeof userPlaylist> | undefined>();
    procedure("user.getPlaylistDetails").mockReturnValueOnce(playlists.promise);
    const pending = runAppAction("play-playlist", context);
    playAll([toSongRow(rawSong({ id: "chosen" }))]);

    if (settle === "missing") playlists.resolve(undefined);
    else playlists.reject(trpcError("UNAUTHORIZED"));
    expect(await pending).toBe("back");
    expect(failureStore.getState().current).toBeNull();
    expect(queuedIds()).toEqual(["chosen"]);
  },
);

describe("play-search", () => {
  it.each(["resolve", "empty", "reject"] as const)(
    "discards a superseded lookup that settles with %s",
    async (settle) => {
      const older = deferred<ReturnType<typeof searchResult>>();
      procedure("search.byType").mockReturnValueOnce(older.promise);
      const pending = runAppAction("play-search", context);
      playAll([toSongRow(rawSong({ id: "chosen" }))]);

      if (settle === "reject") older.reject(new Error("down"));
      else
        older.resolve(
          settle === "empty"
            ? { total: 0, start: 1, results: [] }
            : searchResult("older"),
        );
      const outcome = await pending;

      expect(queuedIds()).toEqual(["chosen"]);
      expect(failureStore.getState().current).toBeNull();
      expect(outcome).toBe("back");
    },
  );

  it("supersedes an older search even when the newer search is still pending", async () => {
    const older = deferred<ReturnType<typeof searchResult>>();
    const newer = deferred<ReturnType<typeof searchResult>>();
    procedure("search.byType")
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const first = runAppAction("play-search", { ...context, q: "first" });
    const second = runAppAction("play-search", { ...context, q: "second" });

    older.resolve(searchResult("older"));
    await first;
    const queueBeforeNewer = queuedIds();
    newer.resolve(searchResult("newer"));
    expect(await second).toBe("player");

    expect(queueBeforeNewer).toEqual([]);
    expect(queuedIds()).toEqual(["newer"]);
  });

  it("reports a current coded refusal through the shared failure mapper", async () => {
    procedure("search.byType").mockRejectedValue(
      trpcError("BAD_REQUEST", "Choose another song"),
    );

    expect(await runAppAction("play-search", context)).toBe("back");

    expect(failureStore.getState().current?.message).toBe(
      "Choose another song",
    );
  });
});
