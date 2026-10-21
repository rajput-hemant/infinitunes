import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { toast } from "sonner-native";

import {
  procedure,
  rawLaunchData,
  rawPlaylist,
  renderScreenAt,
} from "~/features/browse/test-support";
import { playerStore } from "~/playback/player-store";

import { TrendingList } from "./trending-list";

jest.mock(
  "~/lib/trpc",
  () => require("~/features/browse/test-support").trpcMock,
);
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/browse/skeleton-mock"),
);
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));

const home = procedure("home.home");

beforeEach(() => {
  playerStore.setState({
    queue: [],
    currentIndex: 0,
    started: false,
    radio: null,
  });
});

describe("TrendingList", () => {
  it("shows a skeleton under the greeting while the launch data loads", async () => {
    home.mockReturnValue(new Promise(() => {}));
    await renderScreenAt(<TrendingList />);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(screen.getByText("Fresh picks for you.")).toBeOnTheScreen();
  });

  it("shows the hero, quick picks and a shelf per titled section", async () => {
    home.mockResolvedValue(rawLaunchData());
    await renderScreenAt(<TrendingList />);

    expect(await screen.findByText("Featured playlist")).toBeOnTheScreen();
    expect(screen.getByText("Quick picks")).toBeOnTheScreen();
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
    await renderScreenAt(<TrendingList />);

    expect(await screen.findByText("Nothing to play yet")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    home.mockRejectedValueOnce(new Error("upstream down"));
    home.mockResolvedValue(rawLaunchData());
    await renderScreenAt(<TrendingList />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Quick picks")).toBeOnTheScreen();
  });

  it("plays the featured playlist", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("playlist.details").mockResolvedValue(
      rawPlaylist({ list: [rawSong()] }),
    );
    await renderScreenAt(<TrendingList />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Play Featured Mix" }),
    );

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
    expect(playerStore.getState().queue[0]?.name).toBe("FA9LA & Friends");
    expect(procedure("playlist.details")).toHaveBeenCalledWith({ token: "p1" });
  });

  it("starts a shuffled batch of trending songs with Surprise Me", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("get.trending").mockResolvedValue([rawSong(), rawAlbum()]);
    await renderScreenAt(<TrendingList />);

    await fireEvent.press(
      await screen.findByRole("button", {
        name: "Surprise Me - Add songs to queue and play",
      }),
    );

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
    expect(procedure("get.trending")).toHaveBeenCalledWith({ type: "song" });
  });

  it("tells the listener when Surprise Me finds nothing", async () => {
    home.mockResolvedValue(rawLaunchData());
    procedure("get.trending").mockResolvedValue([]);
    await renderScreenAt(<TrendingList />);

    await fireEvent.press(await screen.findByText("Surprise Me"));

    await waitFor(() =>
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        "No songs found right now",
      ),
    );
  });

  it("opens a language's albums from its chip", async () => {
    home.mockResolvedValue(rawLaunchData());
    const app = await renderScreenAt(<TrendingList />, {
      routes: { "browse/albums": () => null },
    });

    await fireEvent.press(screen.getByText("Tamil"));

    expect(app.getPathname()).toBe("/browse/albums");
    expect(app.getSearchParams()).toEqual({ lang: "tamil" });
  });
});
