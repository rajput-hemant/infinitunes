import type { Album } from "@infinitunes/types";
import { rawSong, rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure, trpcError } from "~/test/trpc-mock";

import { AlbumScreen } from "./album-screen";

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
  procedure("album.details").mockResolvedValue(album());
  procedure("album.recommendations").mockResolvedValue([
    rawAlbum({ id: "9", title: "Related Album" }),
  ]);
  procedure("album.sameYear").mockResolvedValue([]);
  procedure("get.trending").mockResolvedValue([]);
});

describe("AlbumScreen", () => {
  it("shows the skeleton while the album loads", async () => {
    procedure("album.details").mockReturnValue(new Promise(() => {}));
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

    expect(procedure("album.sameYear")).toHaveBeenCalledWith({ year: "2026" });
    expect(procedure("album.recommendations")).toHaveBeenCalledWith({
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
    procedure("album.recommendations").mockRejectedValue(new Error("upstream"));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("Teer & Tukka")).toBeOnTheScreen();
    expect(
      screen.queryByRole("header", { name: "Recommended Albums" }),
    ).toBeNull();
  });

  it("says so when the album has no songs", async () => {
    procedure("album.details").mockResolvedValue(album({ list: "" }));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
    expect(screen.getByText("Udta Teer")).toBeOnTheScreen();
  });

  it("offers a retry when the album fails to load", async () => {
    procedure("album.details").mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<AlbumScreen token="LHgqn,SRpyA_" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
  });

  it("shows not found for an album upstream does not have", async () => {
    procedure("album.details").mockRejectedValue(trpcError("NOT_FOUND"));
    await renderScreen(<AlbumScreen token="nope" />);

    expect(await screen.findByText("Album not found")).toBeOnTheScreen();
    expect(screen.queryByText("Try again")).toBeNull();
  });
});
