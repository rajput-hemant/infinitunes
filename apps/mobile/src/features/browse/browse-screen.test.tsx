import { rawChart, rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { BrowseScreen } from "./browse-screen";

const emptyPage = { count: 0, last_page: true, data: [] };

beforeEach(() => {
  procedure("home.home").mockRejectedValue(new Error("offline"));
  procedure("get.topAlbums").mockResolvedValue({
    ...emptyPage,
    data: [rawAlbum()],
  });
  procedure("get.charts").mockResolvedValue([rawChart()]);
  procedure("get.featuredPlaylists").mockResolvedValue(emptyPage);
  procedure("get.topShows").mockResolvedValue({
    ...emptyPage,
    trendingPodcasts: [],
  });
  procedure("get.topArtists").mockResolvedValue({ top_artists: [] });
  procedure("get.featuredStations").mockResolvedValue([]);
});

const routes = {
  chart: () => null,
  album: () => null,
  radio: () => null,
};

describe("BrowseScreen", () => {
  it("shows every category and language tile without waiting on the network", async () => {
    procedure("get.topAlbums").mockReturnValue(new Promise(() => {}));
    await renderScreen(<BrowseScreen />, { routes });

    for (const label of [
      "Top Albums",
      "Top Charts",
      "Top Playlists",
      "Podcasts",
      "Top Artists",
      "Radio",
      "New Releases",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeOnTheScreen();
    }
    expect(screen.getByRole("link", { name: "Tamil" })).toBeOnTheScreen();
    expect(screen.queryByText("Made for you")).toBeNull();
  });

  it("opens a category's list", async () => {
    const app = await renderScreen(<BrowseScreen />, { routes });

    await fireEvent.press(screen.getByRole("link", { name: "Top Charts" }));

    expect(app.getPathname()).toBe("/chart");
  });

  it("opens a language's albums", async () => {
    const app = await renderScreen(<BrowseScreen />, { routes });

    await fireEvent.press(screen.getByRole("link", { name: "Tamil" }));

    expect(app.getPathname()).toBe("/album");
    expect(app.getSearchParams()).toEqual({ lang: "tamil" });
  });

  it("refetches every cover on pull to refresh", async () => {
    await renderScreen(<BrowseScreen />, { routes });
    const intro = await screen.findByText(
      "Explore by category, language or mood.",
    );
    expect(procedure("get.charts")).toHaveBeenCalledTimes(1);

    await userEvent.setup().pullToRefresh(intro.parent!.parent!);

    expect(procedure("get.charts")).toHaveBeenCalledTimes(2);
    expect(procedure("get.featuredStations")).toHaveBeenCalledTimes(2);
  });
});
