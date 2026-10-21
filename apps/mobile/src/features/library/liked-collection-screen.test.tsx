import { rawAlbum } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";
import { favoritesRow } from "~/test/user-library";

import { LikedCollectionScreen } from "./liked-collection-screen";

const albums = {
  "1": rawAlbum({ id: "1", title: "Udta Teer" }),
  "2": rawAlbum({
    id: "2",
    title: "Rock &amp; Roll",
    perma_url: "https://www.jiosaavn.com/album/rock-roll/Qw3rTy_",
  }),
};

function renderLikedAlbums() {
  return renderStack({
    index: () => <LikedCollectionScreen kind="albums" />,
    "album/[name]/[token]": () => null,
  });
}

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  procedure("user.getUserFavorites").mockResolvedValue(
    favoritesRow({ albums: ["1", "2"] }),
  );
  procedure("album.details").mockImplementation(async ({ id }) => {
    const album = albums[id as keyof typeof albums];
    if (!album) throw new Error("gone");
    return album;
  });
});

describe("LikedCollectionScreen", () => {
  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    await renderLikedAlbums();

    expect(screen.getByRole("button", { name: "Sign in" })).toBeOnTheScreen();
  });

  it("shows the liked albums newest first, and opens one", async () => {
    const router = await renderLikedAlbums();

    await screen.findByText("Rock & Roll");
    const titles = screen
      .getAllByText(/Rock|Udta/)
      .map((node) => node.props.children);
    expect(titles).toEqual(["Rock & Roll", "Udta Teer"]);

    await fireEvent.press(screen.getByText("Rock & Roll"));
    expect(router.getPathname()).toBe("/album/rock-roll/Qw3rTy_");
  });

  it("says so when nothing is liked", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(undefined);
    await renderLikedAlbums();

    expect(await screen.findByText("No liked albums yet")).toBeOnTheScreen();
  });

  it("notes the albums that could not load", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ albums: ["1", "2", "3"] }),
    );
    await renderLikedAlbums();

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByText(/1 item couldn't load/)).toBeOnTheScreen();
  });

  it("shows an error when no album can be fetched", async () => {
    procedure("album.details").mockRejectedValue(new Error("down"));
    await renderLikedAlbums();

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Couldn't load this")).toBeOnTheScreen();
  });

  it("says the albums are gone, with a retry, when upstream no longer has any", async () => {
    procedure("album.details").mockRejectedValue(trpcError("NOT_FOUND"));
    await renderLikedAlbums();

    expect(
      await screen.findByText("These 2 items are no longer available"),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Couldn't load this")).not.toBeOnTheScreen();
    expect(screen.queryByText("No liked albums yet")).not.toBeOnTheScreen();

    // Back upstream: the retry lists it.
    procedure("album.details").mockImplementation(async ({ id }) => {
      if (id === "1") return albums["1"];
      throw trpcError("NOT_FOUND");
    });
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByText(/1 item couldn't load/)).toBeOnTheScreen();
  });

  it("treats a mix of removed and failed lookups as an outage", async () => {
    procedure("album.details").mockImplementation(async ({ id }) => {
      throw id === "1" ? trpcError("NOT_FOUND") : new Error("down");
    });
    await renderLikedAlbums();

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
  });
});
