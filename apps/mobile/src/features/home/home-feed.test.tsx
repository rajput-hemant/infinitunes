import {
  rawPlaylist,
  rawLaunchData,
  rawSong,
  rawAlbum,
  rawStationDetails,
} from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { preferencesStore } from "~/lib/preferences";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { HomeFeed } from "./home-feed";

const home = procedure("home.home");

beforeEach(() => {
  playerStore.setState({
    queue: [],
    currentIndex: 0,
    started: false,
    radio: null,
  });
});

describe("HomeFeed", () => {
  it("asks for the listener's languages", async () => {
    preferencesStore.getState().setLanguages(["tamil", "telugu"]);
    home.mockResolvedValue(rawLaunchData());
    await renderScreen(<HomeFeed />);

    await screen.findByRole("link", { name: /^Featured Mix/ });
    expect(home).toHaveBeenCalledWith({ lang: "tamil,telugu" });
    preferencesStore.getState().setLanguages([]);
  });

  it("shows a skeleton under the greeting while the launch data loads", async () => {
    home.mockReturnValue(new Promise(() => {}));
    await renderScreen(<HomeFeed />);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/^Good (morning|afternoon|evening)$/),
    ).toBeOnTheScreen();
  });

  it("shows the featured carousel, quick picks and a shelf per titled section", async () => {
    home.mockResolvedValue(rawLaunchData());
    await renderScreen(<HomeFeed />);

    expect(
      await screen.findByRole("link", { name: /^Featured Mix/ }),
    ).toBeOnTheScreen();
    // A chart leads the carousel's tiles and the Charts shelf.
    expect(
      screen.getAllByRole("link", { name: /^Top 15 Hindi & Punjabi/ }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("header", { name: "Quick picks" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "New Releases" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Radio Stations" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText("Hindi Hits & More, Hindi Radio"),
    ).toBeOnTheScreen();
  });

  it("says so when upstream has nothing to show", async () => {
    home.mockResolvedValue(
      rawLaunchData({
        new_albums: [],
        charts: [],
        radio: [],
        top_playlists: [],
      }),
    );
    await renderScreen(<HomeFeed />);

    expect(await screen.findByText("Nothing to play yet")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    home.mockRejectedValueOnce(new Error("upstream down"));
    home.mockResolvedValue(rawLaunchData());
    await renderScreen(<HomeFeed />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Quick picks")).toBeOnTheScreen();
  });

  it("plays the featured playlist", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("playlist.details").mockResolvedValue(
      rawPlaylist({ list: [rawSong()] }),
    );
    await renderScreen(<HomeFeed />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Play Featured Mix" }),
    );

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
    expect(playerStore.getState().queue[0]?.name).toBe("FA9LA & Friends");
    expect(procedure("playlist.details")).toHaveBeenCalledWith({ token: "p1" });
  });

  it("plays an album from its quick pick's menu without opening it", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("album.details").mockResolvedValue(
      rawAlbum({ list: [rawSong()] }),
    );
    await renderScreen(<HomeFeed />);

    // Quick picks have no Play button (only the carousel does).
    expect(screen.queryByRole("button", { name: "Play Udta Teer" })).toBeNull();
    const [tile] = await screen.findAllByRole("link", { name: "Udta Teer" });
    if (!tile) throw new Error("no quick pick for the album");
    // The screen reader's actions are the long-press menu's entries.
    await fireEvent(tile, "accessibilityAction", {
      nativeEvent: { actionName: "play" },
    });

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
    expect(procedure("album.details")).toHaveBeenCalledWith({
      token: "LHgqn,SRpyA_",
    });
  });

  it("tunes in a station from its card", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("radio.stationDetails").mockResolvedValue(rawStationDetails());
    await renderScreen(<HomeFeed />);

    // Cards have no Play button; their long-press menu offers Play.
    await fireEvent(
      await screen.findByRole("link", { name: /^Hindi Hits & More/ }),
      "longPress",
    );
    await fireEvent(screen.getByTestId("card-menu"), "pressAction", {
      nativeEvent: { event: "play" },
    });

    await waitFor(() =>
      expect(playerStore.getState().radio?.stationId).toBe("session-42"),
    );
  });

  it("starts a shuffled batch of trending songs with Surprise Me", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("get.trending").mockResolvedValue([rawSong(), rawAlbum()]);
    await renderScreen(<HomeFeed />);

    await fireEvent.press(
      await screen.findByRole("button", {
        name: "Surprise Me",
      }),
    );

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
    expect(procedure("get.trending")).toHaveBeenCalledWith({ type: "song" });
  });

  it("tells the listener when Surprise Me finds nothing", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("get.trending").mockResolvedValue([]);
    await renderScreen(<HomeFeed />);

    await fireEvent.press(await screen.findByText("Surprise Me"));

    await waitFor(() =>
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        "No songs found right now",
      ),
    );
  });

  it("opens Browse from its quick pick, before any catalog data", async () => {
    home.mockResolvedValue(rawLaunchData());
    const app = await renderScreen(<HomeFeed />, {
      routes: { browse: () => null },
    });

    await fireEvent.press(await screen.findByRole("link", { name: "Browse" }));

    expect(app.getPathname()).toBe("/browse");
  });

  it("opens a language's albums from its chip", async () => {
    home.mockResolvedValue(rawLaunchData());
    const app = await renderScreen(<HomeFeed />, {
      routes: { album: () => null },
    });

    await fireEvent.press(screen.getByText("Tamil"));

    expect(app.getPathname()).toBe("/album");
    expect(app.getSearchParams()).toEqual({ lang: "tamil" });
  });
});
