import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { playerStore } from "~/playback/player-store";

import { LabelScreen } from "./label-screen";
import { LABEL_TOKEN, rawLabel } from "./test-fixtures";
import { labelAnswer } from "./test-trpc";

jest.mock("~/lib/trpc", () => require("~/features/label/test-trpc"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/artist/test-skeleton"),
);

const initialPlayer = playerStore.getState();

function renderLabel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  return renderRouter({
    index: () => (
      <QueryClientProvider client={queryClient}>
        <LabelScreen token={LABEL_TOKEN} />
      </QueryClientProvider>
    ),
    "album/[token]": () => null,
  });
}

function findTitle() {
  return screen.findByRole("header", { name: "Outlaw Productions & Co" });
}

function selectTab(index: number) {
  return fireEvent(screen.getByTestId("label-tabs"), "onChange", {
    nativeEvent: { selectedSegmentIndex: index, value: "" },
  });
}

function failure(code: string, message: string) {
  return Object.assign(new Error(message), { data: { code } });
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  labelAnswer.mockResolvedValue(rawLabel());
});

describe("LabelScreen", () => {
  it("shows a skeleton while the label loads", async () => {
    labelAnswer.mockReturnValue(new Promise(() => {}));
    await renderLabel();

    expect(
      screen.getAllByRole("progressbar", { name: "Loading" }).length,
    ).toBeGreaterThan(0);
  });

  it("asks for the label by route token", async () => {
    await renderLabel();
    await findTitle();

    expect(labelAnswer).toHaveBeenCalledWith({
      token: LABEL_TOKEN,
      page: 0,
      n_song: 50,
      n_album: 50,
      cat: "popularity",
      sort: "asc",
    });
  });

  it("opens on the albums, which open their screen", async () => {
    const app = await renderLabel();
    await findTitle();

    await fireEvent.press(screen.getByText("Udta Teer"));

    expect(app.getPathname()).toBe("/album/LHgqn,SRpyA_");
  });

  it("lists the songs on the Songs tab and queues them from the pressed row", async () => {
    await renderLabel();
    await findTitle();
    await selectTab(0);

    await fireEvent.press(screen.getByRole("button", { name: "Second Song" }));

    expect(playerStore.getState().queue).toHaveLength(2);
    expect(playerStore.getState().currentIndex).toBe(1);
  });

  it("plays the label's songs from the header", async () => {
    await renderLabel();
    await fireEvent.press(await screen.findByRole("button", { name: "Play" }));

    expect(playerStore.getState().queue).toHaveLength(2);
  });

  it("says so when a tab is empty", async () => {
    labelAnswer.mockResolvedValue(
      rawLabel({ topSongs: { songs: [], total: 0 } }),
    );
    await renderLabel();
    await findTitle();
    await selectTab(0);

    expect(screen.getByText("No songs yet")).toBeOnTheScreen();
  });

  it("shows not found for an unknown label, without a retry", async () => {
    labelAnswer.mockRejectedValue(
      failure("NOT_FOUND", "Failed to fetch label details"),
    );
    await renderLabel();

    expect(await screen.findByText("Label not found")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("offers a retry when loading fails", async () => {
    labelAnswer.mockRejectedValueOnce(
      failure("BAD_REQUEST", "Please provide a token"),
    );
    await renderLabel();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(await findTitle()).toBeOnTheScreen();
  });
});
