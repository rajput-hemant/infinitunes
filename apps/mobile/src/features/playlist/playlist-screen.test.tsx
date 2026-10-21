import { rawPlaylist } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure, trpcError } from "~/test/trpc-mock";

import { PlaylistScreen } from "./playlist-screen";

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  procedure("playlist.details").mockResolvedValue(rawPlaylist());
  procedure("playlist.recommendations").mockResolvedValue([]);
  procedure("get.trending").mockResolvedValue([
    rawPlaylist({ id: "2", title: "Trending Mix" }),
  ]);
});

describe("PlaylistScreen", () => {
  it("shows the skeleton while the playlist loads", async () => {
    procedure("playlist.details").mockReturnValue(new Promise(() => {}));
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("shows the header, songs, trending playlists and artists", async () => {
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Hits & Misses")).toBeOnTheScreen();
    expect(screen.getByText("Playlist")).toBeOnTheScreen();
    // The curator line, and one row's subtitle.
    expect(screen.getAllByText("Editors Picks")).toHaveLength(2);
    expect(screen.getByText("Hindi · 50 Songs")).toBeOnTheScreen();
    expect(screen.getByText("Opener")).toBeOnTheScreen();
    expect(screen.getByText("Closer")).toBeOnTheScreen();
    expect(await screen.findByText("Trending Mix")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Trending Playlists" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Arijit & Co")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Like Hits & Misses" }),
    ).toBeOnTheScreen();
  });

  it("plays the playlist, and from a pressed row", async () => {
    await renderScreen(<PlaylistScreen token="AbCd_" />);
    await screen.findByText("Hits & Misses");

    await fireEvent.press(screen.getByRole("button", { name: "Closer" }));

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "song-1",
      "song-2",
    ]);
    expect(playerStore.getState().currentIndex).toBe(1);
  });

  it("leaves out the artists shelf when upstream credits none", async () => {
    procedure("playlist.details").mockResolvedValue(
      rawPlaylist({
        more_info: { ...rawPlaylist().more_info, artists: undefined },
      }),
    );
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Opener")).toBeOnTheScreen();
    expect(screen.queryByRole("header", { name: "Artists" })).toBeNull();
  });

  it("lists recommended playlists when there are some", async () => {
    procedure("playlist.recommendations").mockResolvedValue([
      rawPlaylist({ id: "5", title: "Similar One" }),
    ]);
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Similar One")).toBeOnTheScreen();
    expect(procedure("playlist.recommendations")).toHaveBeenCalledWith({
      id: "1134543272",
    });
  });

  it("says so when the playlist has no songs", async () => {
    procedure("playlist.details").mockResolvedValue(rawPlaylist({ list: "" }));
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
  });

  it("offers a retry when the playlist fails to load", async () => {
    procedure("playlist.details").mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Hits & Misses")).toBeOnTheScreen();
  });

  it("shows not found for a playlist upstream does not have", async () => {
    procedure("playlist.details").mockRejectedValue(trpcError("NOT_FOUND"));
    await renderScreen(<PlaylistScreen token="nope" />);

    expect(await screen.findByText("Playlist not found")).toBeOnTheScreen();
  });
});
