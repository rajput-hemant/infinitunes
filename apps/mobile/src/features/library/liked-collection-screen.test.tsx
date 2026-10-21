import { rawAlbum } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { signInAs } from "~/test/session-mock";

import { favoriteLists, trpcClient } from "./library-test-support";
import { LikedCollectionScreen } from "./liked-collection-screen";
import { renderLibrary } from "./render-library";

jest.mock("~/lib/trpc", () => require("./library-test-support"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock(
  "~/components/ui/skeleton",
  () => require("./library-ui-mocks").skeleton,
);

const albums = {
  "1": rawAlbum({ id: "1", title: "Udta Teer" }),
  "2": rawAlbum({
    id: "2",
    title: "Rock &amp; Roll",
    perma_url: "https://www.jiosaavn.com/album/rock-roll/Qw3rTy_",
  }),
};

function renderLikedAlbums() {
  return renderLibrary({
    index: () => <LikedCollectionScreen kind="albums" />,
    "album/[token]": () => null,
  });
}

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  trpcClient.user.getUserFavorites.query.mockResolvedValue(
    favoriteLists({ albums: ["1", "2"] }),
  );
  trpcClient.album.details.query.mockImplementation(async ({ id }) => {
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
    expect(router.getPathname()).toBe("/album/Qw3rTy_");
  });

  it("says so when nothing is liked", async () => {
    trpcClient.user.getUserFavorites.query.mockResolvedValue(undefined);
    await renderLikedAlbums();

    expect(await screen.findByText("No liked albums yet")).toBeOnTheScreen();
  });

  it("notes the albums that could not load", async () => {
    trpcClient.user.getUserFavorites.query.mockResolvedValue(
      favoriteLists({ albums: ["1", "2", "3"] }),
    );
    await renderLikedAlbums();

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByText(/1 item couldn't load/)).toBeOnTheScreen();
  });

  it("shows an error when no album can be fetched", async () => {
    trpcClient.album.details.query.mockRejectedValue(new Error("down"));
    await renderLikedAlbums();

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeOnTheScreen();
  });
});
