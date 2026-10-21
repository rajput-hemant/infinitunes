import {
  rawAlbum,
  rawArtist,
  rawEpisode,
  rawShow,
  rawSong,
  rawStationDetails,
} from "@infinitunes/types/fixtures";
import { toast } from "sonner-native";

import { procedure } from "~/test/trpc-mock";

import { isPlayable, playEntity } from "./play-entity";
import { playerStore } from "./player-store";

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

  it("says so when the item has nothing to play, and keeps the queue", async () => {
    procedure("album.details").mockResolvedValue(rawAlbum({ list: "" }));

    await playEntity("album", ALBUM_URL);

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Nothing to play here yet.",
    );
    expect(queuedIds()).toEqual([]);
  });

  it("toasts when the lookup fails", async () => {
    procedure("playlist.details").mockRejectedValue(new Error("down"));

    await playEntity("playlist", "https://www.jiosaavn.com/featured/x/abc_");

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Couldn't load songs",
    );
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
