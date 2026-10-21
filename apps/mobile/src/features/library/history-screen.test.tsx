import { act, screen } from "@testing-library/react-native";

import { signInAs } from "~/test/session-mock";

import { HistoryScreen } from "./history-screen";
import {
  catalogAnswering,
  songNamed,
  trpcClient,
} from "./library-test-support";
import { renderLibrary } from "./render-library";

jest.mock("~/lib/trpc", () => require("./library-test-support"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock(
  "react-native-gesture-handler/ReanimatedSwipeable",
  () => require("./library-ui-mocks").swipeable,
);
jest.mock(
  "~/components/ui/skeleton",
  () => require("./library-ui-mocks").skeleton,
);

const catalog = {
  a: songNamed("a", "Played Long Ago"),
  b: songNamed("b", "Played Yesterday"),
  c: songNamed("c", "Played Just Now"),
};

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  trpcClient.history.list.query.mockResolvedValue([
    { id: "c", type: "song" },
    { id: "b", type: "song" },
    { id: "a", type: "song" },
  ]);
  trpcClient.song.items.query.mockImplementation(catalogAnswering(catalog));
});

describe("HistoryScreen", () => {
  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    await renderLibrary({ index: HistoryScreen });

    expect(screen.getByRole("button", { name: "Sign in" })).toBeOnTheScreen();
    expect(trpcClient.history.list.query).not.toHaveBeenCalled();
  });

  it("lists what was played, newest first", async () => {
    await renderLibrary({ index: HistoryScreen });

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
    trpcClient.history.list.query.mockResolvedValue([]);
    await renderLibrary({ index: HistoryScreen });

    expect(await screen.findByText("Nothing played yet")).toBeOnTheScreen();
    expect(trpcClient.song.items.query).not.toHaveBeenCalled();
  });

  it("shows an error when the history cannot be read", async () => {
    trpcClient.history.list.query.mockRejectedValue(new Error("down"));
    await renderLibrary({ index: HistoryScreen });

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeOnTheScreen();
  });
});
