import { toSongRow } from "@infinitunes/types";
import {
  rawSong,
  rawStation,
  rawStationDetails,
} from "@infinitunes/types/fixtures";

import { failureStore } from "~/lib/failure";
import { procedure } from "~/test/trpc-mock";

import { playerStore } from "./player-store";
import {
  playStation,
  radioSeedOf,
  startSeededRadio,
  startStation,
} from "./radio";

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

describe("radioSeedOf", () => {
  it("seeds an artist station from the primary artist, not the first credit", () => {
    // The fixture credits the composer first and the singer as primary.
    const song = toSongRow(rawSong());
    expect(song.artists[0]?.name).not.toBe(song.primaryArtists[0]?.name);

    expect(radioSeedOf([song])).toEqual({
      name: song.primaryArtists[0]?.name,
      artistId: song.primaryArtists[0]?.id,
      language: "arabic",
    });
  });

  it("falls back to the credits when a row has no primary artists", () => {
    const [credit] = toSongRow(rawSong()).artists;
    expect(
      radioSeedOf([{ name: "Mix", artists: credit ? [credit] : [] }]),
    ).toEqual({
      name: credit?.name,
      artistId: credit?.id,
      language: undefined,
    });
  });

  it("names a featured station after the collection when nobody is credited", () => {
    expect(radioSeedOf([{ name: "Song", artists: [] }], "Road Trip")).toEqual({
      name: "Road Trip",
      language: undefined,
    });
  });

  it("uses the first track's name when no fallback is given, and '' for no tracks", () => {
    expect(radioSeedOf([{ name: "Song", artists: [] }]).name).toBe("Song");
    expect(radioSeedOf([])).toEqual({ name: "", language: undefined });
  });
});

describe("startStation", () => {
  it("queues the songs from the chosen index and marks the queue as radio", () => {
    startStation(rawStationDetails(), 1);

    expect(queuedIds()).toEqual(["BSaNI3Yr", "Ab12Cd34"]);
    expect(playerStore.getState()).toMatchObject({
      currentIndex: 1,
      started: true,
      radio: {
        stationId: "session-42",
        // The station title arrives HTML-encoded.
        name: "Hindi Hits & More",
        type: "featured",
        language: "hindi",
      },
    });
  });

  it("leaves the queue alone when the station has no songs", () => {
    startStation(rawStationDetails({ songs: [] }));

    expect(playerStore.getState()).toMatchObject({
      queue: [],
      started: false,
      radio: null,
    });
  });
});

describe("playStation", () => {
  it("does not replace a newer direct play with late station details", async () => {
    const details =
      Promise.withResolvers<ReturnType<typeof rawStationDetails>>();
    procedure("radio.stationDetails").mockReturnValueOnce(details.promise);
    const pending = playStation({ name: "old", token: "old" });
    playerStore.getState().playTracks([toSongRow(rawSong({ id: "chosen" }))]);
    details.resolve(rawStationDetails());
    await pending;
    expect(queuedIds()).toEqual(["chosen"]);
    expect(playerStore.getState().radio).toBeNull();
  });

  it("loads a featured station by name and token and plays it", async () => {
    const details = procedure("radio.stationDetails");
    details.mockResolvedValue(rawStationDetails({ station: rawStation() }));

    await playStation({ name: "hindi-featured-station", token: "station-1" });

    expect(details).toHaveBeenCalledWith({
      name: "hindi-featured-station",
      token: "station-1",
    });
    expect(playerStore.getState().started).toBe(true);
  });

  it("does not throw when the lookup fails", async () => {
    procedure("radio.stationDetails").mockRejectedValue(new Error("down"));

    await expect(
      playStation({ name: "x", token: "y" }),
    ).resolves.toBeUndefined();

    expect(playerStore.getState().started).toBe(false);
    expect(failureStore.getState().current).toMatchObject({
      message: "Couldn't start this station.",
      action: { label: "Retry" },
    });
  });
});

describe("startSeededRadio", () => {
  const songs = [rawSong(), rawSong({ id: "Ab12Cd34" })];

  it("discards a seeded station whose songs arrive after a newer play", async () => {
    procedure("radio.createStation").mockResolvedValue({ stationId: "old" });
    const batch = Promise.withResolvers<typeof songs>();
    procedure("radio.songs").mockReturnValueOnce(batch.promise);
    const pending = startSeededRadio({ name: "Old" });
    await Promise.resolve();
    playerStore.getState().playTracks([toSongRow(rawSong({ id: "chosen" }))]);
    batch.resolve(songs);
    await pending;
    expect(queuedIds()).toEqual(["chosen"]);
    expect(playerStore.getState().radio).toBeNull();
  });

  it("makes an artist station and queues its first batch as '<name> Radio'", async () => {
    const create = procedure("radio.createStation");
    create.mockResolvedValue({ stationId: "st-9" });
    const fetchSongs = procedure("radio.songs");
    fetchSongs.mockResolvedValue(songs);

    await startSeededRadio({
      name: "Flipperachi",
      artistId: "artist-1",
      language: "arabic",
    });

    expect(create).toHaveBeenCalledWith({
      type: "artist",
      name: "Flipperachi",
      artistId: "artist-1",
      language: "arabic",
    });
    expect(fetchSongs).toHaveBeenCalledWith({ stationId: "st-9", k: 20 });
    expect(queuedIds()).toEqual(["BSaNI3Yr", "Ab12Cd34"]);
    expect(playerStore.getState().radio).toEqual({
      stationId: "st-9",
      name: "Flipperachi Radio",
      type: "artist",
    });
  });

  it("makes a featured station when there is no artist to seed", async () => {
    const create = procedure("radio.createStation");
    create.mockResolvedValue({ stationId: "st-1" });
    procedure("radio.songs").mockResolvedValue(songs);

    await startSeededRadio({ name: "FA9LA" });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "featured", name: "FA9LA" }),
    );
    expect(playerStore.getState().radio?.type).toBe("featured");
  });

  it("queues nothing when the station has no songs", async () => {
    procedure("radio.createStation").mockResolvedValue({ stationId: "st-2" });
    procedure("radio.songs").mockResolvedValue([]);

    await startSeededRadio({ name: "Quiet" });

    expect(playerStore.getState().queue).toEqual([]);
    expect(playerStore.getState().radio).toBeNull();
    expect(failureStore.getState().current?.message).toBe(
      "Couldn't start radio.",
    );
  });

  it("never asks for songs when creating the station fails", async () => {
    procedure("radio.createStation").mockRejectedValue(new Error("down"));

    await expect(startSeededRadio({ name: "X" })).resolves.toBeUndefined();

    expect(procedure("radio.songs")).not.toHaveBeenCalled();

    // Retry asks again.
    procedure("radio.createStation").mockResolvedValue({ stationId: "st-3" });
    procedure("radio.songs").mockResolvedValue(songs);
    failureStore.getState().current?.action?.onPress();
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);
    expect(playerStore.getState().radio?.stationId).toBe("st-3");
  });
});
