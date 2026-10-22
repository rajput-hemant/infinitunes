import { toSongRow } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";

import { failureStore } from "~/lib/failure";
import { playAll } from "~/playback/play-collection";
import { playEntity } from "~/playback/play-entity";
import { playerStore } from "~/playback/player-store";
import { procedure } from "~/test/trpc-mock";
import { deferred } from "~/test/user-library";

import { playSurprise } from "./play-home";

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

describe("playSurprise", () => {
  it("queues only the trending songs, not the albums and playlists mixed in", async () => {
    const trending = procedure("get.trending");
    trending.mockResolvedValue([
      rawSong({ id: "s1" }),
      rawAlbum({ id: "alb" }),
      rawSong({ id: "s2" }),
      rawSong({ id: "s3" }),
    ]);

    await playSurprise();

    expect(trending).toHaveBeenCalledWith({ type: "song" });
    expect(queuedIds()).toHaveLength(3);
    expect(queuedIds()).toEqual(expect.arrayContaining(["s1", "s2", "s3"]));
    // A shuffled queue starts from its first entry.
    expect(playerStore.getState()).toMatchObject({
      currentIndex: 0,
      started: true,
      radio: null,
    });
  });

  it("replaces what was queued", async () => {
    procedure("get.trending").mockResolvedValue([rawSong({ id: "s1" })]);
    await playSurprise();
    procedure("get.trending").mockResolvedValue([rawSong({ id: "s9" })]);

    await playSurprise();

    expect(queuedIds()).toEqual(["s9"]);
  });

  it("keeps the queue when nothing is trending", async () => {
    procedure("get.trending").mockResolvedValue([rawSong({ id: "keep" })]);
    await playSurprise();
    procedure("get.trending").mockResolvedValue([rawAlbum()]);

    await playSurprise();

    expect(queuedIds()).toEqual(["keep"]);
  });

  it("does not throw when the lookup fails", async () => {
    procedure("get.trending").mockRejectedValue(new Error("down"));

    await expect(playSurprise()).resolves.toBeUndefined();

    expect(playerStore.getState().started).toBe(false);
    expect(failureStore.getState().current?.message).toBe(
      "Couldn't load songs to play.",
    );
    expect(failureStore.getState().current?.action?.label).toBe("Retry");
  });

  it("keeps the newer Surprise Me when an older lookup resolves last", async () => {
    const older = deferred<ReturnType<typeof rawSong>[]>();
    procedure("get.trending")
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce([rawSong({ id: "newer" })]);

    const pending = playSurprise();
    await playSurprise();
    older.resolve([rawSong({ id: "older" })]);
    await pending;

    expect(queuedIds()).toEqual(["newer"]);
  });

  it.each(["resolve", "reject"] as const)(
    "discards a superseded lookup that later %ss",
    async (settle) => {
      const older = deferred<ReturnType<typeof rawSong>[]>();
      procedure("get.trending").mockReturnValueOnce(older.promise);
      const pending = playSurprise();
      playAll([toSongRow(rawSong({ id: "chosen" }))]);

      if (settle === "resolve") older.resolve([rawSong({ id: "older" })]);
      else older.reject(new Error("down"));
      await pending;

      expect(queuedIds()).toEqual(["chosen"]);
      expect(failureStore.getState().current).toBeNull();
    },
  );

  it("supersedes a pending catalog play before its own lookup finishes", async () => {
    const album = deferred<ReturnType<typeof rawAlbum>>();
    const trending = deferred<ReturnType<typeof rawSong>[]>();
    procedure("album.details").mockReturnValueOnce(album.promise);
    procedure("get.trending").mockReturnValueOnce(trending.promise);
    const catalogPlay = playEntity(
      "album",
      "https://www.jiosaavn.com/album/a/token",
    );
    const surprise = playSurprise();

    album.resolve(rawAlbum({ list: [rawSong({ id: "older" })] }));
    await catalogPlay;
    const queueBeforeTrending = queuedIds();
    trending.resolve([rawSong({ id: "surprise" })]);
    await surprise;

    expect(queueBeforeTrending).toEqual([]);
    expect(queuedIds()).toEqual(["surprise"]);
  });
});
