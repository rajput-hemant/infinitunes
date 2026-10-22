import {
  rawArtist,
  rawEpisode,
  rawLabel,
  rawMix,
  rawPlaylist,
  rawSong,
  rawStationDetails,
} from "@infinitunes/types/fixtures";

import { procedure } from "~/test/trpc-mock";

import { playEntity } from "./play-entity";
import { playerStore } from "./player-store";

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

describe("playEntity by type", () => {
  it("plays a song by its token", async () => {
    const details = procedure("song.details");
    details.mockResolvedValue({ songs: [rawSong({ id: "Solo1" })] });

    await playEntity("song", "https://www.jiosaavn.com/song/fa9la/KQ0cBjJHZ2Y");

    expect(details).toHaveBeenCalledWith({ token: "KQ0cBjJHZ2Y" });
    expect(queuedIds()).toEqual(["Solo1"]);
    expect(playerStore.getState().started).toBe(true);
  });

  it("plays a playlist's songs", async () => {
    const details = procedure("playlist.details");
    details.mockResolvedValue(
      rawPlaylist({ list: [rawSong({ id: "P1" }), rawSong({ id: "P2" })] }),
    );

    await playEntity("playlist", "https://www.jiosaavn.com/featured/hits/abc_");

    expect(details).toHaveBeenCalledWith({ token: "abc_" });
    expect(queuedIds()).toEqual(["P1", "P2"]);
  });

  it("plays a mix from its songs", async () => {
    const mix = procedure("get.mix");
    mix.mockResolvedValue(rawMix());

    await playEntity("mix", "https://www.jiosaavn.com/featured/chill/XyZ_");

    expect(mix).toHaveBeenCalledWith({ token: "XyZ_" });
    expect(queuedIds()).toEqual(["song-1", "song-2"]);
  });

  it("plays a label's top songs", async () => {
    const label = procedure("get.label");
    label.mockResolvedValue(rawLabel());

    await playEntity(
      "label",
      "https://www.jiosaavn.com/label/outlaw-productions-songs/pKJp4RENQb4_",
    );

    expect(label).toHaveBeenCalledWith({ token: "pKJp4RENQb4_" });
    expect(queuedIds()).toEqual(["BSaNI3Yr", "second01"]);
  });

  it("plays one episode by its token, not the whole show", async () => {
    const details = procedure("show.episodeDetails");
    details.mockResolvedValue({
      episodes: [rawEpisode("9001")],
      modules: {
        episode_details: {
          source: "show",
          position: 1,
          title: "",
          subtitle: "",
        },
        episode_starring: {
          source: "show",
          position: 2,
          title: "",
          subtitle: "",
        },
      },
    });

    await playEntity(
      "episode",
      "https://www.jiosaavn.com/shows/the-ranveer-show/ep-9001/Ub3k8aNq1Zc_",
    );

    expect(details).toHaveBeenCalledWith({ token: "Ub3k8aNq1Zc_" });
    expect(queuedIds()).toEqual(["9001"]);
  });

  it("has nothing to play for an artist without top songs", async () => {
    const { topSongs: _omitted, ...withoutTopSongs } = rawArtist();
    procedure("artist.details").mockResolvedValue(withoutTopSongs);

    await playEntity(
      "artist",
      "https://www.jiosaavn.com/artist/x/LnMfdXjMGl0_",
    );

    expect(playerStore.getState().started).toBe(false);
  });

  it("keeps what was playing when an item has nothing to play", async () => {
    procedure("song.details").mockResolvedValue({ songs: [rawSong()] });
    await playEntity("song", "https://www.jiosaavn.com/song/fa9la/KQ0cBjJHZ2Y");
    procedure("playlist.details").mockResolvedValue(rawPlaylist({ list: "" }));

    await playEntity("playlist", "https://www.jiosaavn.com/featured/hits/abc_");

    expect(queuedIds()).toEqual(["BSaNI3Yr"]);
  });
});

describe("playEntity for a radio station", () => {
  it("asks nothing for a link that is not a station's", async () => {
    await playEntity("radio_station", "https://example.com/not-a-station");

    expect(procedure("radio.stationDetails")).not.toHaveBeenCalled();
  });

  it("asks for the station by the name and token of its link", async () => {
    const details = procedure("radio.stationDetails");
    details.mockResolvedValue(rawStationDetails());

    await playEntity(
      "radio_station",
      "https://www.saavn.com/s/radio/hindi-featured-station/station-1",
    );

    expect(details).toHaveBeenCalledWith({
      name: "hindi-featured-station",
      token: "station-1",
    });
  });
});
