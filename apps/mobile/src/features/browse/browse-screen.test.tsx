import { rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { BrowseScreen } from "./browse-screen";
import { procedure, rawChart, renderScreenAt } from "./test-support";

jest.mock(
  "~/lib/trpc",
  () => require("~/features/browse/test-support").trpcMock,
);

const emptyPage = { count: 0, last_page: true, data: [] };

beforeEach(() => {
  procedure("home.home").mockRejectedValue(new Error("offline"));
  procedure("get.topAlbums").mockResolvedValue({
    ...emptyPage,
    data: [rawAlbum()],
  });
  procedure("get.charts").mockResolvedValue([rawChart()]);
  procedure("get.featuredPlaylists").mockResolvedValue(emptyPage);
  procedure("get.topShows").mockResolvedValue(emptyPage);
  procedure("get.topArtists").mockResolvedValue({ top_artists: [] });
  procedure("get.featuredStations").mockResolvedValue([]);
});

const routes = {
  charts: () => null,
  "browse/albums": () => null,
  radio: () => null,
};

describe("BrowseScreen", () => {
  it("shows every category and language tile without waiting on the network", async () => {
    procedure("get.topAlbums").mockReturnValue(new Promise(() => {}));
    await renderScreenAt(<BrowseScreen />, { routes });

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
    const app = await renderScreenAt(<BrowseScreen />, { routes });

    await fireEvent.press(screen.getByRole("link", { name: "Top Charts" }));

    expect(app.getPathname()).toBe("/charts");
  });

  it("opens a language's albums", async () => {
    const app = await renderScreenAt(<BrowseScreen />, { routes });

    await fireEvent.press(screen.getByRole("link", { name: "Tamil" }));

    expect(app.getPathname()).toBe("/browse/albums");
    expect(app.getSearchParams()).toEqual({ lang: "tamil" });
  });
});
