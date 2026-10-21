import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { trpcClient } from "~/test/trpc-mock";

import { LikeButton } from "./like-button";

jest.mock("~/lib/trpc", () => require("~/test/trpc-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));

/** Alice liked the song; Bob never liked anything (no favorites row). */
const likedBy: Record<string, string[]> = { alice: ["BSaNI3Yr"] };
let viewer: string | null = null;

function switchTo(userId: string | null) {
  viewer = userId;
  return act(async () => signInAs(userId));
}

const heart = <LikeButton type="song" token="BSaNI3Yr" name="FA9LA" />;

beforeEach(async () => {
  await switchTo(null);
  trpcClient.user.getUserFavorites.query.mockImplementation(async () => {
    const songs = viewer ? likedBy[viewer] : undefined;
    return songs
      ? { songs, albums: [], playlists: [], artists: [], podcasts: [] }
      : undefined;
  });
});

afterEach(resetFavoriteOverlay);

describe("LikeButton", () => {
  it("lets a listener who never liked anything like a song", async () => {
    await switchTo("bob");
    await renderWithProviders(heart);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Like FA9LA" }),
    );

    expect(trpcClient.user.addToFavorites.mutate).toHaveBeenCalledWith({
      type: "song",
      token: "BSaNI3Yr",
    });
    expect(
      screen.getByRole("button", { name: "Unlike FA9LA" }),
    ).toBeOnTheScreen();
  });

  it("shows each account its own likes", async () => {
    await switchTo("alice");
    await renderWithProviders(heart);
    expect(
      await screen.findByRole("button", { name: "Unlike FA9LA" }),
    ).toBeOnTheScreen();

    await switchTo("bob");
    expect(
      await screen.findByRole("button", { name: "Like FA9LA" }),
    ).toBeOnTheScreen();

    await switchTo(null);
    expect(
      screen.getByRole("button", { name: "Like FA9LA" }),
    ).toBeOnTheScreen();
  });
});
