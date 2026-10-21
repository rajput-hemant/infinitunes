import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { toast } from "sonner-native";

import { playerStore } from "~/playback/player-store";
import { procedure } from "~/test/trpc-mock";

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
    expect(queuedIds().toSorted()).toEqual(["s1", "s2", "s3"]);
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

  it("says so, and keeps the queue, when nothing is trending", async () => {
    procedure("get.trending").mockResolvedValue([rawSong({ id: "keep" })]);
    await playSurprise();
    procedure("get.trending").mockResolvedValue([rawAlbum()]);

    await playSurprise();

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "No songs found right now",
    );
    expect(queuedIds()).toEqual(["keep"]);
  });

  it("toasts instead of throwing when the lookup fails", async () => {
    procedure("get.trending").mockRejectedValue(new Error("down"));

    await expect(playSurprise()).resolves.toBeUndefined();

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Failed to load songs",
    );
    expect(playerStore.getState().started).toBe(false);
  });
});
