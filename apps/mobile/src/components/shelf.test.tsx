import { toCardItem } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement } from "react";

import { playerStore } from "~/playback/player-store";
import { procedure } from "~/test/trpc-mock";

import { Shelf } from "./shelf";

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

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

  it("marks an explicit item's card and names it so", async () => {
    const explicit = toCardItem(rawAlbum({ explicit_content: "1" }));
    await renderShelf(<Shelf title="New Releases" items={[explicit]} />);

    expect(
      screen.getByRole("link", {
        name: "Udta Teer, Explicit, Sachin-Jigar, Amitabh Bhattacharya",
      }),
    ).toBeOnTheScreen();
    // The link's label says it, so the mark itself is hidden from screen readers.
    expect(
      screen.getByText("E", { includeHiddenElements: true }),
    ).toBeOnTheScreen();
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

  it("gives regular cards no Play button, only a long-press menu", async () => {
    procedure("album.details").mockResolvedValue(
      rawAlbum({ list: [rawSong(), rawSong({ id: "s2" })] }),
    );
    await renderShelf(<Shelf title="New Releases" items={albums} />);

    expect(screen.queryByRole("button", { name: "Play Udta Teer" })).toBeNull();
    // No card keeps a native menu host until it is long pressed.
    expect(screen.queryByTestId("card-menu")).toBeNull();
    await fireEvent(
      screen.getByRole("link", { name: /^Udta Teer/ }),
      "longPress",
    );
    await fireEvent(screen.getByTestId("card-menu"), "pressAction", {
      nativeEvent: { event: "add-to-queue" },
    });

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(2));
    expect(procedure("album.details")).toHaveBeenCalledWith({
      token: "LHgqn,SRpyA_",
    });
  });

  it("offers the menu's actions to screen readers on the card", async () => {
    await renderShelf(<Shelf title="New Releases" items={albums} />);

    expect(
      screen
        .getByRole("link", { name: /^Udta Teer/ })
        .props.accessibilityActions.map(
          ({ label }: { label: string }) => label,
        ),
    ).toEqual(["Play", "Play Next", "Add to Queue"]);
  });

  it("shows hero cards without a header, each with a Play button", async () => {
    procedure("album.details").mockResolvedValue(
      rawAlbum({ list: [rawSong()] }),
    );
    await renderShelf(<Shelf items={albums} variant="hero" />);

    expect(screen.queryByRole("header")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Play Udta Teer" }),
    );

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
  });

  it("renders nothing without items", async () => {
    await renderShelf(<Shelf title="New Releases" items={[]} />);

    expect(screen.queryByText("New Releases")).toBeNull();
  });
});
