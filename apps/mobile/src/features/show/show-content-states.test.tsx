import { rawEpisode, rawShow, SHOW_TOKEN } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { ShowScreen } from "./show-screen";

const initialPlayer = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  procedure("show.details").mockResolvedValue(rawShow());
  procedure("show.episodes").mockResolvedValue([
    rawEpisode("9001"),
    rawEpisode("9002"),
  ]);
});

describe("ShowScreen episode list", () => {
  it("says the episodes are still loading rather than playing nothing", async () => {
    procedure("show.episodes").mockReturnValue(new Promise(() => {}));
    await renderScreen(<ShowScreen token={SHOW_TOKEN} />);

    await fireEvent.press(await screen.findByRole("button", { name: "Play" }));

    expect(jest.mocked(toast)).toHaveBeenCalledWith(
      "Episodes are still loading",
    );
    expect(playerStore.getState().queue).toEqual([]);
  });

  it("shuffles the season from the header", async () => {
    await renderScreen(<ShowScreen token={SHOW_TOKEN} />);
    await screen.findByText("Episode 9001 & more");

    await fireEvent.press(screen.getByRole("button", { name: "Shuffle" }));

    const { queue, currentIndex } = playerStore.getState();
    expect(queue.map((entry) => entry.id).toSorted()).toEqual(["9001", "9002"]);
    expect(currentIndex).toBe(0);
  });

  it("opens the season the route names, and the latest otherwise", async () => {
    const episodes = procedure("show.episodes");
    await renderScreen(<ShowScreen token={SHOW_TOKEN} season={1} />);
    await waitFor(() =>
      expect(episodes).toHaveBeenCalledWith(
        expect.objectContaining({ season: 1, page: 1 }),
      ),
    );
    expect(episodes).not.toHaveBeenCalledWith(
      expect.objectContaining({ season: 2 }),
    );
  });

  it("asks for the latest season when the route's season is not a number", async () => {
    const episodes = procedure("show.episodes");
    await renderScreen(<ShowScreen token={SHOW_TOKEN} season={Number.NaN} />);

    await waitFor(() =>
      expect(episodes).toHaveBeenCalledWith(
        expect.objectContaining({ season: 2, page: 1 }),
      ),
    );
  });

  it("shows an error with a retry when the episodes fail, keeping the header", async () => {
    procedure("show.episodes").mockRejectedValueOnce(new Error("down"));
    await renderScreen(<ShowScreen token={SHOW_TOKEN} />);

    expect(
      await screen.findByRole("header", { name: "The Ranveer Show & Friends" }),
    ).toBeOnTheScreen();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(await screen.findByText("Episode 9001 & more")).toBeOnTheScreen();
  });
});
