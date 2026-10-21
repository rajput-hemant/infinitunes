import type { ArtistMini, Playlist } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { catalog, notFoundError } from "~/features/song/catalog-mock";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

import { PlaylistScreen } from "./playlist-screen";

jest.mock("~/lib/trpc", () => require("~/features/song/catalog-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/song/skeleton-mock"),
);

const ARTIST: ArtistMini = {
  id: "7",
  name: "Arijit &amp; Co",
  role: "",
  image: "https://c.saavncdn.com/artists/Arijit_150x150.jpg",
  type: "artist",
  perma_url: "https://www.jiosaavn.com/artist/arijit-songs/QwErTy_",
};

function playlist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: "1134543272",
    title: "Hits &amp; Misses",
    subtitle: "Editors Picks",
    type: "playlist",
    perma_url: "https://www.jiosaavn.com/featured/hits/AbCd_",
    image: "https://c.saavncdn.com/playlists/hits-150x150.jpg",
    language: "hindi",
    explicit_content: "0",
    list_type: "song",
    list: [
      rawSong({ id: "song-1", title: "Opener" }),
      rawSong({ id: "song-2", title: "Closer" }),
    ],
    more_info: {
      uid: "u1",
      is_dolby_content: false,
      username: "jiosaavn",
      firstname: "JioSaavn",
      lastname: "",
      playlist_type: "default",
      artists: [ARTIST],
      subtitle_desc: ["50 Songs", "Hindi"],
    },
    ...overrides,
  };
}

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  catalog.playlist.details.mockResolvedValue(playlist());
  catalog.playlist.recommendations.mockResolvedValue([]);
  catalog.get.trending.mockResolvedValue([
    playlist({ id: "2", title: "Trending Mix" }),
  ]);
});

describe("PlaylistScreen", () => {
  it("shows the skeleton while the playlist loads", async () => {
    catalog.playlist.details.mockReturnValue(new Promise(() => {}));
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("shows the header, songs, trending playlists and artists", async () => {
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Hits & Misses")).toBeOnTheScreen();
    expect(
      screen.getByText("Editors Picks · Hindi · 50 Songs"),
    ).toBeOnTheScreen();
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
    catalog.playlist.details.mockResolvedValue(
      playlist({
        more_info: { ...playlist().more_info, artists: undefined },
      }),
    );
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Opener")).toBeOnTheScreen();
    expect(screen.queryByRole("header", { name: "Artists" })).toBeNull();
  });

  it("lists recommended playlists when there are some", async () => {
    catalog.playlist.recommendations.mockResolvedValue([
      rawAlbum({ id: "5", title: "Similar One" }),
    ]);
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Similar One")).toBeOnTheScreen();
    expect(catalog.playlist.recommendations).toHaveBeenCalledWith({
      id: "1134543272",
    });
  });

  it("says so when the playlist has no songs", async () => {
    catalog.playlist.details.mockResolvedValue(playlist({ list: "" }));
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
  });

  it("offers a retry when the playlist fails to load", async () => {
    catalog.playlist.details.mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<PlaylistScreen token="AbCd_" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Hits & Misses")).toBeOnTheScreen();
  });

  it("shows not found for a playlist upstream does not have", async () => {
    catalog.playlist.details.mockRejectedValue(notFoundError());
    await renderScreen(<PlaylistScreen token="nope" />);

    expect(
      await screen.findByText("Couldn't find this playlist"),
    ).toBeOnTheScreen();
  });
});
