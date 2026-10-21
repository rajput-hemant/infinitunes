import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { favoritesRow } from "~/test/user-library";

import { LikeButton } from "./like-button";

const announce = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions",
);

beforeEach(async () => {
  announce.mockImplementation(() => {});
  await act(async () => signInAs(null));
  procedure("user.getUserFavorites").mockResolvedValue(favoritesRow({}));
});

afterEach(resetFavoriteOverlay);

describe("LikeButton announcements (VoiceOver)", () => {
  it("says what a press did, since the screen does not change", async () => {
    await act(async () => signInAs("bob"));
    await renderWithProviders(
      <LikeButton type="song" token="BSaNI3Yr" name="FA9LA" />,
    );
    await waitFor(() =>
      expect(procedure("user.getUserFavorites")).toHaveBeenCalled(),
    );
    await act(async () => {});

    await fireEvent.press(
      await screen.findByRole("button", { name: "Like FA9LA" }),
    );
    expect(announce).toHaveBeenLastCalledWith("Liked FA9LA", { queue: true });

    await fireEvent.press(
      await screen.findByRole("button", { name: "Unlike FA9LA" }),
    );
    expect(announce).toHaveBeenLastCalledWith("Removed FA9LA from liked", {
      queue: true,
    });
  });

  it("stays quiet when nothing was liked (signed out)", async () => {
    await renderWithProviders(
      <LikeButton type="song" token="BSaNI3Yr" name="FA9LA" />,
    );

    await fireEvent.press(
      await screen.findByRole("button", { name: "Like FA9LA" }),
    );

    expect(announce).not.toHaveBeenCalled();
  });
});
