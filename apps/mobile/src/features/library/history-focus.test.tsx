import { act, screen, waitFor } from "@testing-library/react-native";
import { router as appRouter } from "expo-router";

import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { catalogAnswering, songNamed } from "~/test/user-library";

import { HistoryScreen } from "./history-screen";

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  procedure("history.list").mockResolvedValue([{ id: "a", type: "song" }]);
  procedure("song.items").mockImplementation(
    catalogAnswering({
      a: songNamed("a", "First Play"),
      b: songNamed("b", "Played Meanwhile"),
    }),
  );
});

describe("HistoryScreen on a tab that stays mounted", () => {
  it("shows a play made elsewhere when the screen is focused again", async () => {
    const router = await renderStack({
      index: HistoryScreen,
      login: () => null,
    });
    await screen.findByText("First Play");
    expect(procedure("history.list")).toHaveBeenCalledTimes(1);

    // The listener goes to another screen and plays something there.
    await act(async () => appRouter.push("/login"));
    procedure("history.list").mockResolvedValue([
      { id: "b", type: "song" },
      { id: "a", type: "song" },
    ]);
    await act(async () => appRouter.back());

    await waitFor(() =>
      expect(procedure("history.list")).toHaveBeenCalledTimes(2),
    );
    expect(await screen.findByText("Played Meanwhile")).toBeOnTheScreen();
    expect(router.getPathname()).toBe("/");
  });

  it("does not fetch a second time on the first focus", async () => {
    await renderStack({ index: HistoryScreen });
    await screen.findByText("First Play");
    await act(async () => {});

    expect(procedure("history.list")).toHaveBeenCalledTimes(1);
  });
});
