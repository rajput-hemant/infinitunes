import { toCardItem } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement } from "react";

import { Shelf } from "./shelf";

const albums = [
  rawAlbum(),
  rawAlbum({
    id: "1234567",
    title: "Rock &amp; Roll",
    perma_url: "https://www.jiosaavn.com/album/rock-roll/Qw3rTy_",
  }),
].map(toCardItem);

function renderShelf(ui: ReactElement) {
  return renderRouter({
    index: () => ui,
    "album/[name]/[token]": () => null,
    search: () => null,
  });
}

describe("Shelf", () => {
  it("shows a titled card per item with decoded names", async () => {
    await renderShelf(<Shelf title="New Releases" items={albums} />);

    expect(
      screen.getByRole("header", { name: "New Releases" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByText("Rock & Roll")).toBeOnTheScreen();
    expect(screen.queryByText("See All")).toBeNull();
  });

  it("opens the album screen for a card", async () => {
    const router = await renderShelf(
      <Shelf title="New Releases" items={albums} />,
    );

    await fireEvent.press(screen.getByText("Rock & Roll"));

    expect(router.getPathname()).toBe("/album/rock-roll/Qw3rTy_");
  });

  it("links to the full list", async () => {
    const router = await renderShelf(
      <Shelf title="New Releases" items={albums} seeAllHref="/search" />,
    );

    await fireEvent.press(screen.getByText("See All"));

    expect(router.getPathname()).toBe("/search");
  });

  it("renders nothing without items", async () => {
    await renderShelf(<Shelf title="New Releases" items={[]} />);

    expect(screen.queryByText("New Releases")).toBeNull();
  });
});
