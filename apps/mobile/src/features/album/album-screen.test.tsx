import type { Album } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { catalog, notFoundError } from "~/features/song/catalog-mock";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

import { AlbumScreen } from "./album-screen";

jest.mock("~/lib/trpc", () => require("~/features/song/catalog-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/song/skeleton-mock"),
);

const FIRST = rawSong({ id: "song-1", title: "Teer &amp; Tukka" });
const SECOND = rawSong({ id: "song-2", title: "Second Song" });

function album(overrides: Partial<Album> = {}): Album {
  return rawAlbum({
    list: [FIRST, SECOND],
    play_count: "1200",
    more_info: {
      copyright_text: "(P) 2026 Sony &amp; Co",
      artistMap: {
        primary_artists: [],
        artists: [
          {
            id: "1",
            name: "Sachin-Jigar",
            role: "music",
            image: "",
            type: "artist",
            perma_url: "https://www.jiosaavn.com/artist/sachin-jigar/abc_",
          },
        ],
      },
    },
    ...overrides,
  });
}

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  catalog.album.details.mockResolvedValue(album());
  catalog.album.recommendations.mockResolvedValue([
    rawAlbum({ id: "9", title: "Related Album" }),
  ]);
  catalog.album.sameYear.mockResolvedValue([]);
  catalog.get.trending.mockResolvedValue([]);
});

describe("AlbumScreen", () => {
  it("shows the skeleton while the album loads", async () => {
    catalog.album.details.mockReturnValue(new Promise(() => {}));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    // Header, song list and shelf each have a placeholder.
    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("shows the header, meta line, songs, copyright and shelves", async () => {
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
    expect(
      screen.getByText("Sachin-Jigar · 2 Songs · 1.2K Plays · 03:30"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Teer & Tukka")).toBeOnTheScreen();
    expect(screen.getByText("Second Song")).toBeOnTheScreen();
    expect(screen.getByText("(P) 2026 Sony & Co")).toBeOnTheScreen();
    expect(await screen.findByText("Related Album")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Recommended Albums" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Like Udta Teer" }),
    ).toBeOnTheScreen();
  });

  it("asks upstream for the same-year albums of the album's year", async () => {
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);
    await screen.findByText("Udta Teer");

    expect(catalog.album.sameYear).toHaveBeenCalledWith({ year: "2026" });
    expect(catalog.album.recommendations).toHaveBeenCalledWith({
      id: "82064668",
    });
  });

  it("plays the album from the top, shuffled, or from a pressed row", async () => {
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);
    await screen.findByText("Udta Teer");

    await fireEvent.press(screen.getByRole("button", { name: "Play" }));
    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "song-1",
      "song-2",
    ]);
    expect(playerStore.getState().currentIndex).toBe(0);

    await fireEvent.press(screen.getByRole("button", { name: "Second Song" }));
    expect(playerStore.getState().currentIndex).toBe(1);

    await fireEvent.press(screen.getByRole("button", { name: "Shuffle" }));
    expect(playerStore.getState().queue).toHaveLength(2);
    expect(playerStore.getState().currentIndex).toBe(0);
  });

  it("keeps the page when a secondary shelf fails", async () => {
    catalog.album.recommendations.mockRejectedValue(new Error("upstream"));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("Teer & Tukka")).toBeOnTheScreen();
    expect(
      screen.queryByRole("header", { name: "Recommended Albums" }),
    ).toBeNull();
  });

  it("says so when the album has no songs", async () => {
    catalog.album.details.mockResolvedValue(album({ list: "" }));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
    expect(screen.getByText("Udta Teer")).toBeOnTheScreen();
  });

  it("offers a retry when the album fails to load", async () => {
    catalog.album.details.mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
  });

  it("shows not found for an album upstream does not have", async () => {
    catalog.album.details.mockRejectedValue(notFoundError());
    await renderScreen(<AlbumScreen token="nope" />);

    expect(
      await screen.findByText("Couldn't find this album"),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Try again")).toBeNull();
  });
});
