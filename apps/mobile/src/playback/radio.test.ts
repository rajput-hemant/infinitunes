import { toSongRow } from "@infinitunes/types";
import {
  rawSong,
  rawStation,
  rawStationDetails,
} from "@infinitunes/types/fixtures";
import { toast } from "sonner-native";

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

  it("toasts and leaves the queue alone when the station has no songs", () => {
    startStation(rawStationDetails({ songs: [] }));

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "No songs found for this radio station",
    );
    expect(playerStore.getState()).toMatchObject({
      queue: [],
      started: false,
      radio: null,
    });
  });
});

describe("playStation", () => {
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

  it("toasts instead of throwing when the lookup fails", async () => {
    procedure("radio.stationDetails").mockRejectedValue(new Error("down"));

    await expect(
      playStation({ name: "x", token: "y" }),
    ).resolves.toBeUndefined();

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Failed to load radio station",
    );
    expect(playerStore.getState().started).toBe(false);
  });
});

describe("startSeededRadio", () => {
  const songs = [rawSong(), rawSong({ id: "Ab12Cd34" })];

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

  it("toasts and queues nothing when the station has no songs", async () => {
    procedure("radio.createStation").mockResolvedValue({ stationId: "st-2" });
    procedure("radio.songs").mockResolvedValue([]);

    await startSeededRadio({ name: "Quiet" });

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Could not find songs for this radio",
    );
    expect(playerStore.getState().queue).toEqual([]);
    expect(playerStore.getState().radio).toBeNull();
  });

  it("toasts when creating the station fails, and never asks for songs", async () => {
    procedure("radio.createStation").mockRejectedValue(new Error("down"));

    await expect(startSeededRadio({ name: "X" })).resolves.toBeUndefined();

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Unable to start radio station",
    );
    expect(procedure("radio.songs")).not.toHaveBeenCalled();
  });
});
