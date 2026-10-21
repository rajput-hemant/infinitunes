import { rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { TopAlbumsScreen } from "./top-albums-screen";

const topAlbums = procedure("get.topAlbums");

const page = (data: ReturnType<typeof rawAlbum>[], lastPage = true) => ({
  count: data.length,
  last_page: lastPage,
  data,
});

describe("TopAlbumsScreen", () => {
  it("shows a skeleton under the language chips while albums load", async () => {
    topAlbums.mockReturnValue(new Promise(() => {}));
    await renderScreen(<TopAlbumsScreen />);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Trending across your languages"),
    ).toBeOnTheScreen();
  });

  it("lists albums with decoded titles and an end marker on the last page", async () => {
    topAlbums.mockResolvedValue(
      page([rawAlbum(), rawAlbum({ id: "2", title: "Rock &amp; Roll" })]),
    );
    await renderScreen(<TopAlbumsScreen />);

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByText("Rock & Roll")).toBeOnTheScreen();
    expect(screen.getByText("You have seen it all")).toBeOnTheScreen();
    expect(topAlbums).toHaveBeenCalledWith({
      page: 1,
      n: 50,
      lang: undefined,
    });
  });

  it("filters by the language in the URL and switches language from a chip", async () => {
    topAlbums.mockResolvedValue(page([rawAlbum()]));
    const app = await renderScreen(<TopAlbumsScreen />, {
      initialUrl: "/?lang=tamil",
    });

    expect(
      await screen.findByText("Tamil albums trending this week"),
    ).toBeOnTheScreen();
    expect(topAlbums).toHaveBeenCalledWith({ page: 1, n: 50, lang: "tamil" });

    await fireEvent.press(screen.getByRole("button", { name: "Telugu" }));

    await waitFor(() =>
      expect(topAlbums).toHaveBeenCalledWith({
        page: 1,
        n: 50,
        lang: "telugu",
      }),
    );
    expect(app.getSearchParams()).toEqual({ lang: "telugu" });

    await fireEvent.press(screen.getByRole("button", { name: "All" }));

    expect(
      await screen.findByText("Trending across your languages"),
    ).toBeOnTheScreen();
  });

  it("ignores a language it does not offer", async () => {
    topAlbums.mockResolvedValue(page([rawAlbum()]));
    await renderScreen(<TopAlbumsScreen />, { initialUrl: "/?lang=klingon" });

    await screen.findByText("Udta Teer");

    expect(topAlbums).toHaveBeenCalledWith({ page: 1, n: 50, lang: undefined });
  });

  it("says so when a language has no albums", async () => {
    topAlbums.mockResolvedValue(page([]));
    await renderScreen(<TopAlbumsScreen />);

    expect(await screen.findByText("No albums yet")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    topAlbums.mockRejectedValueOnce(new Error("upstream down"));
    topAlbums.mockResolvedValue(page([rawAlbum()]));
    await renderScreen(<TopAlbumsScreen />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
  });
});
