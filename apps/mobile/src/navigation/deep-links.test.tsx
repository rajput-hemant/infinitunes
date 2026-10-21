import { rawShow, rawEpisode } from "@infinitunes/types/fixtures";
import { waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { queryClient } from "~/lib/query-client";
import { procedure } from "~/test/trpc-mock";

/**
 * A link opens the app's real route files; what they pass on to the screen
 * (the token, the season, the tab) decides what gets fetched.
 */
// The real app runs on the app's own query client, which would answer a repeated
// link from its cache (and schedules timers that outlive a test).
beforeEach(() => queryClient.clear());
afterAll(() => queryClient.clear());

const open = (initialUrl: string) => renderRouter("./src/app", { initialUrl });

describe("entity links fetch by their token, whatever the name slug says", () => {
  it.each([
    ["an album", "/album/udta-teer/LHgqn,SRpyA_", "album.details"],
    ["a song", "/song/fa9la/KQ0cBjJHZ2Y", "song.details"],
    ["a playlist", "/playlist/hits/abc_", "playlist.details"],
    ["an artist", "/artist/flipperachi/LnMfdXjMGl0_", "artist.details"],
    [
      "an artist tab",
      "/artist/flipperachi/LnMfdXjMGl0_/songs",
      "artist.details",
    ],
    ["a label", "/label/t-series/pKJp4RENQb4_", "get.label"],
    ["a mix", "/mix/chill/XyZ_", "get.mix"],
    ["an episode", "/episode/ep-1/Ub3k8aNq1Zc_", "show.episodeDetails"],
  ] as const)("%s", async (_what, url, path) => {
    const token =
      url.split("/").at(-1) === "songs"
        ? url.split("/").at(-2)
        : url.split("/").at(-1);
    await open(url);

    await waitFor(() =>
      expect(procedure(path)).toHaveBeenCalledWith(
        expect.objectContaining({ token }),
      ),
    );
  });

  it("a station by its name and token", async () => {
    await open("/radio/hindi-featured-station/station-1");

    await waitFor(() =>
      expect(procedure("radio.stationDetails")).toHaveBeenCalledWith({
        name: "hindi-featured-station",
        token: "station-1",
      }),
    );
  });

  it("reads a percent-encoded token as the token it encodes", async () => {
    await open("/album/udta-teer/LHgqn%2CSRpyA_");

    await waitFor(() =>
      expect(procedure("album.details")).toHaveBeenCalledWith(
        expect.objectContaining({ token: "LHgqn,SRpyA_" }),
      ),
    );
  });
});

const seasonAsked = () =>
  procedure("show.episodes").mock.calls.map(([input]) => input.season);

describe("a show link's season", () => {
  beforeEach(() => {
    procedure("show.details").mockResolvedValue(rawShow());
    procedure("show.episodes").mockResolvedValue([rawEpisode("9001")]);
  });

  it("opens the season the link names", async () => {
    await open("/show/the-ranveer-show/1/mXtDJ4Yd2Sw_");

    await waitFor(() => expect(seasonAsked()).toContain(1));
    expect(seasonAsked()).not.toContain(2);
  });

  it.each([
    ["not a number", "abc"],
    ["too long to be a season", "12345"],
    ["a negative number", "-1"],
    ["a decimal", "1.5"],
  ])("opens the latest season when it is %s", async (_why, season) => {
    await open(`/show/the-ranveer-show/${season}/mXtDJ4Yd2Sw_`);

    // The fixture's latest season is 2.
    await waitFor(() => expect(seasonAsked()).toContain(2));
    expect(seasonAsked()).toEqual(seasonAsked().map(() => 2));
  });
});
