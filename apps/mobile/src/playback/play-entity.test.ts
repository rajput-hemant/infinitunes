import { toSongRow } from "@infinitunes/types";
import {
  rawAlbum,
  rawArtist,
  rawEpisode,
  rawShow,
  rawSong,
  rawStationDetails,
} from "@infinitunes/types/fixtures";

import { procedure } from "~/test/trpc-mock";

import { isPlayable, playEntity } from "./play-entity";
import { playerStore } from "./player-store";
import { seekTo, togglePlayback } from "./transport";

const ALBUM_URL = "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_";

beforeEach(() => {
  playerStore.setState({
    queue: [],
    currentIndex: 0,
    started: false,
    radio: null,
  });
});

function queuedIds() {
  return playerStore.getState().queue.map((entry) => entry.id);
}

describe("playEntity", () => {
  it("keeps the newer async play when an older lookup resolves last", async () => {
    const older = Promise.withResolvers<ReturnType<typeof rawAlbum>>();
    procedure("album.details")
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce(rawAlbum({ list: [rawSong({ id: "newer" })] }));
    const pending = playEntity("album", ALBUM_URL);
    await playEntity("album", ALBUM_URL);
    older.resolve(rawAlbum({ list: [rawSong({ id: "older" })] }));
    await pending;
    expect(queuedIds()).toEqual(["newer"]);
  });

  it.each(["tracks", "row", "next", "previous", "start", "toggle", "seek"])(
    "discards an async result superseded by a direct %s action",
    async (action) => {
      const state = playerStore.getState();
      state.playTracks(
        [rawSong({ id: "direct" }), rawSong({ id: "next" })].map(toSongRow),
      );
      const older = Promise.withResolvers<ReturnType<typeof rawAlbum>>();
      procedure("album.details").mockReturnValueOnce(older.promise);
      const pending = playEntity("album", ALBUM_URL);
      if (action === "tracks")
        state.playTracks([toSongRow(rawSong({ id: "chosen" }))]);
      if (action === "row") state.playAt(1);
      if (action === "next") state.skipToNext();
      if (action === "previous") state.skipToPrevious();
      if (action === "start") state.start();
      if (action === "toggle") togglePlayback();
      if (action === "seek") seekTo(30);
      const chosen = playerStore.getState().queue;
      older.resolve(rawAlbum({ list: [rawSong({ id: "older" })] }));
      await pending;
      expect(playerStore.getState().queue).toBe(chosen);
    },
  );

  it("queues an album's songs by its token and starts playing", async () => {
    const details = procedure("album.details");
    details.mockResolvedValue(
      rawAlbum({ list: [rawSong(), rawSong({ id: "Second1" })] }),
    );

    await playEntity("album", ALBUM_URL);

    expect(details).toHaveBeenCalledWith({ token: "LHgqn,SRpyA_" });
    expect(queuedIds()).toEqual(["BSaNI3Yr", "Second1"]);
    expect(playerStore.getState()).toMatchObject({
      currentIndex: 0,
      started: true,
      radio: null,
    });
  });

  it("plays an artist's top songs", async () => {
    procedure("artist.details").mockResolvedValue(
      rawArtist({ topSongs: [rawSong({ id: "Top1" })] }),
    );

    await playEntity(
      "artist",
      "https://www.jiosaavn.com/artist/x/LnMfdXjMGl0_",
    );

    expect(queuedIds()).toEqual(["Top1"]);
  });

  it("plays a show's first episodes from its details", async () => {
    const details = procedure("show.details");
    details.mockResolvedValue(
      rawShow({ episodes: [rawEpisode("9001"), rawEpisode("9002")] }),
    );

    await playEntity("show", "https://www.jiosaavn.com/shows/x/1/mXtDJ4Yd2Sw_");

    expect(details).toHaveBeenCalledWith({ token: "mXtDJ4Yd2Sw_" });
    expect(queuedIds()).toEqual(["9001", "9002"]);
  });

  it("tunes in a station and marks the queue as radio", async () => {
    procedure("radio.stationDetails").mockResolvedValue(rawStationDetails());

    await playEntity(
      "radio_station",
      "https://www.saavn.com/s/radio/hindi-featured-station/station-1",
    );

    expect(queuedIds()).toEqual(["BSaNI3Yr", "Ab12Cd34"]);
    expect(playerStore.getState().radio).toMatchObject({
      stationId: "session-42",
      type: "featured",
    });
  });

  it("keeps the queue when the item has nothing to play", async () => {
    procedure("album.details").mockResolvedValue(rawAlbum({ list: "" }));

    await playEntity("album", ALBUM_URL);

    expect(queuedIds()).toEqual([]);
  });

  it("does not start when the lookup fails", async () => {
    procedure("playlist.details").mockRejectedValue(new Error("down"));

    await playEntity("playlist", "https://www.jiosaavn.com/featured/x/abc_");

    expect(playerStore.getState().started).toBe(false);
  });
});

describe("isPlayable", () => {
  it("covers what a card can queue, not channels or seasons", () => {
    expect(isPlayable("album")).toBe(true);
    expect(isPlayable("radio_station")).toBe(true);
    expect(isPlayable("channel")).toBe(false);
    expect(isPlayable("season")).toBe(false);
  });
});
