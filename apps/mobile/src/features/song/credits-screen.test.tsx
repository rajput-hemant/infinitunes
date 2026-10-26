import type { Song } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { CreditsScreen, creditGroups } from "./credits-screen";

const artist = (id: string, name: string, role: string) => ({
  id,
  name,
  role,
  image: "",
  type: "artist" as const,
  perma_url: `https://www.jiosaavn.com/artist/${name.toLowerCase()}-songs/${id}_`,
});

function song(): Song {
  const base = rawSong();
  return {
    ...base,
    more_info: {
      ...base.more_info,
      artistMap: {
        primary_artists: [],
        featured_artists: [],
        artists: [
          artist("1", "Ana", "singer"),
          artist("2", "Bo", "music"),
          artist("2", "Bo", "lyricist"),
          artist("3", "Cy", "starring"),
          artist("4", "Di", "mixer"),
        ],
      },
    },
  };
}

describe("creditGroups", () => {
  it("groups by section and joins one person's roles", () => {
    const groups = creditGroups(song()).map(({ title, people }) => [
      title,
      people.map(
        ({ artist: { name }, roles }) => `${name}: ${roles.join("+")}`,
      ),
    ]);
    expect(groups).toEqual([
      ["Performing Artists", ["Ana: Singer"]],
      ["Composition & Lyrics", ["Bo: Composer+Lyricist"]],
      ["Starring", ["Cy: Starring"]],
      ["Other", ["Di: Mixer"]],
    ]);
  });
});

describe("CreditsScreen", () => {
  it("loads credit cards without song-row action placeholders", async () => {
    procedure("song.details").mockReturnValue(new Promise(() => {}));
    await renderScreen(<CreditsScreen token="song-token" />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    expect(screen.queryAllByTestId("row-skeleton-menu")).toHaveLength(0);
    expect(screen.queryAllByTestId("row-skeleton-like")).toHaveLength(0);
  });
  it("renders the sections from the song's details", async () => {
    procedure("song.details").mockResolvedValue({
      songs: [song()],
      modules: undefined,
    });
    await renderScreen(<CreditsScreen token="song-token" />);

    expect(await screen.findByText("Credits")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Performing Artists" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Composition & Lyrics" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("link", { name: "Bo, Composer, Lyricist" }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("link", { name: /^FA9LA/ })).toBeOnTheScreen();
  });
});
