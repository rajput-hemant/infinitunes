import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { favoritesRow } from "~/test/user-library";

import { LikeButton } from "./like-button";

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
  procedure("user.getUserFavorites").mockImplementation(async () => {
    const songs = viewer ? likedBy[viewer] : undefined;
    return songs ? favoritesRow({ songs }) : undefined;
  });
});

afterEach(resetFavoriteOverlay);

describe("LikeButton", () => {
  it("lets a listener who never liked anything like a song", async () => {
    await switchTo("bob");
    await renderWithProviders(heart);
    // A tap before the favorites row is known writes nothing; let it land.
    await waitFor(() =>
      expect(procedure("user.getUserFavorites")).toHaveBeenCalled(),
    );
    await act(async () => {});

    await fireEvent.press(
      await screen.findByRole("button", { name: "Like FA9LA" }),
    );

    expect(procedure("user.addToFavorites")).toHaveBeenCalledWith({
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
    expect(screen.queryByRole("button", { name: /Like FA9LA/ })).toBeNull();
  });
});
