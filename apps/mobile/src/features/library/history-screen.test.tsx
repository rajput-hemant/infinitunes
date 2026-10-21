import { act, screen } from "@testing-library/react-native";

import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { songNamed, catalogAnswering } from "~/test/user-library";

import { HistoryScreen } from "./history-screen";

const catalog = {
  a: songNamed("a", "Played Long Ago"),
  b: songNamed("b", "Played Yesterday"),
  c: songNamed("c", "Played Just Now"),
};

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  procedure("history.list").mockResolvedValue([
    { id: "c", type: "song" },
    { id: "b", type: "song" },
    { id: "a", type: "song" },
  ]);
  procedure("song.items").mockImplementation(catalogAnswering(catalog));
});

describe("HistoryScreen", () => {
  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    await renderStack({ index: HistoryScreen });

    expect(screen.getByRole("button", { name: "Sign in" })).toBeOnTheScreen();
    expect(procedure("history.list")).not.toHaveBeenCalled();
  });

  it("lists what was played, newest first", async () => {
    await renderStack({ index: HistoryScreen });

    await screen.findByText("Played Just Now");
    const titles = screen
      .getAllByText(/^Played/)
      .map((node) => node.props.children);
    expect(titles).toEqual([
      "Played Just Now",
      "Played Yesterday",
      "Played Long Ago",
    ]);
  });

  it("says so when nothing was played yet", async () => {
    procedure("history.list").mockResolvedValue([]);
    await renderStack({ index: HistoryScreen });

    expect(await screen.findByText("Nothing played yet")).toBeOnTheScreen();
    expect(procedure("song.items")).not.toHaveBeenCalled();
  });

  it("shows an error when the history cannot be read", async () => {
    procedure("history.list").mockRejectedValue(new Error("down"));
    await renderStack({ index: HistoryScreen });

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeOnTheScreen();
  });
});
