import {
  rawShow,
  rawSeason,
  rawEpisode,
  SHOW_TOKEN,
} from "@infinitunes/types/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { playerStore } from "~/playback/player-store";
import { procedure } from "~/test/trpc-mock";

import { ShowScreen } from "./show-screen";

const initialPlayer = playerStore.getState();

/** Episodes by `page`, one array per page; past the last page upstream answers `[]`. */
function serveEpisodes(...pages: ReturnType<typeof rawEpisode>[][]) {
  procedure("show.episodes").mockImplementation(async (input) => {
    const { page } = input as { page: number };
    return pages[page - 1] ?? [];
  });
}

function renderShow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  return renderRouter({
    index: () => (
      <QueryClientProvider client={queryClient}>
        <ShowScreen token={SHOW_TOKEN} />
      </QueryClientProvider>
    ),
  });
}

function findTitle() {
  return screen.findByRole("header", { name: "The Ranveer Show & Friends" });
}

function choose(menu: "season-menu" | "sort-menu", id: string) {
  return fireEvent(screen.getByTestId(menu), "onPressAction", {
    nativeEvent: { event: id },
  });
}

function failure(code: string, message: string) {
  return Object.assign(new Error(message), { data: { code } });
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  procedure("show.details").mockResolvedValue(rawShow());
  serveEpisodes([rawEpisode("9001"), rawEpisode("9002")], [rawEpisode("9003")]);
});

describe("ShowScreen", () => {
  it("shows a skeleton while the show loads", async () => {
    procedure("show.details").mockReturnValue(new Promise(() => {}));
    await renderShow();

    expect(
      screen.getAllByRole("progressbar", { name: "Loading" }).length,
    ).toBeGreaterThan(0);
  });

  it("shows the show with its description as plain text", async () => {
    await renderShow();

    expect(await findTitle()).toBeOnTheScreen();
    expect(screen.getByText("2.3K Fans")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "About" })).toBeOnTheScreen();
    expect(screen.getByText("Conversations with creators.")).toBeOnTheScreen();
    expect(procedure("show.details")).toHaveBeenCalledWith({
      token: SHOW_TOKEN,
    });
  });

  it("lists the latest season's episodes, newest first, by the show's numeric id", async () => {
    await renderShow();

    expect(await screen.findByText("Episode 9001 & more")).toBeOnTheScreen();
    expect(screen.getByText("Episode 9002 & more")).toBeOnTheScreen();
    expect(procedure("show.episodes")).toHaveBeenCalledWith({
      id: "5555",
      season: 2,
      page: 1,
      sort: "desc",
    });
  });

  it("switches season without losing the header", async () => {
    procedure("show.episodes").mockImplementation(async (input) => {
      const { season } = input as { season: number };
      return season === 1 ? [rawEpisode("8001")] : [rawEpisode("9001")];
    });
    await renderShow();
    await screen.findByText("Episode 9001 & more");

    await choose("season-menu", "1");

    expect(await screen.findByText("Episode 8001 & more")).toBeOnTheScreen();
    expect(screen.queryByText("Episode 9001 & more")).toBeNull();
    expect(
      screen.getByRole("header", { name: "The Ranveer Show & Friends" }),
    ).toBeOnTheScreen();
    expect(procedure("show.episodes")).toHaveBeenLastCalledWith({
      id: "5555",
      season: 1,
      page: 1,
      sort: "desc",
    });
  });

  it("reorders the episodes oldest first", async () => {
    await renderShow();
    await screen.findByText("Episode 9001 & more");

    await choose("sort-menu", "asc");

    await screen.findByText("Episode 9001 & more");
    expect(procedure("show.episodes")).toHaveBeenLastCalledWith({
      id: "5555",
      season: 2,
      page: 1,
      sort: "asc",
    });
  });

  it("has no season picker for a single-season show", async () => {
    procedure("show.details").mockResolvedValue(
      rawShow({ seasons: [rawSeason(2)] }),
    );
    await renderShow();
    await findTitle();

    expect(screen.queryByTestId("season-menu")).toBeNull();
    expect(screen.getByTestId("sort-menu")).toBeOnTheScreen();
  });

  it("pages episodes until the season's count is reached", async () => {
    await renderShow();
    await screen.findByText("Episode 9001 & more");

    await act(async () => {
      fireEvent(screen.getByTestId("show-list"), "endReached");
    });
    expect(await screen.findByText("Episode 9003 & more")).toBeOnTheScreen();
    expect(procedure("show.episodes")).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );

    // 3 of 3 loaded: no third request.
    await act(async () => {
      fireEvent(screen.getByTestId("show-list"), "endReached");
    });
    expect(procedure("show.episodes")).toHaveBeenCalledTimes(2);
  });

  it("refreshes the show and its episodes on pull to refresh", async () => {
    await renderShow();
    await screen.findByText("Episode 9001 & more");

    await act(async () => {
      fireEvent(screen.getByTestId("show-list"), "refresh");
    });

    await waitFor(() =>
      expect(procedure("show.details")).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(procedure("show.episodes")).toHaveBeenCalledTimes(2),
    );
  });

  it("queues the episodes from the pressed row", async () => {
    await renderShow();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Episode 9002 & more" }),
    );

    const { queue, currentIndex } = playerStore.getState();
    expect(queue.map((entry) => entry.id)).toEqual(["9001", "9002"]);
    expect(queue[0]?.type).toBe("episode");
    expect(currentIndex).toBe(1);
  });

  it("plays the season from the header", async () => {
    await renderShow();
    await screen.findByText("Episode 9001 & more");

    await fireEvent.press(screen.getByRole("button", { name: "Play" }));

    expect(playerStore.getState().queue).toHaveLength(2);
  });

  it("says so when the season has no episodes", async () => {
    serveEpisodes();
    await renderShow();

    expect(await screen.findByText("No episodes yet")).toBeOnTheScreen();
  });

  it("shows not found for an unknown show, without a retry", async () => {
    procedure("show.details").mockRejectedValue(
      failure("NOT_FOUND", "No show found, please check the token"),
    );
    await renderShow();

    expect(await screen.findByText("Podcast not found")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("offers a retry when loading fails", async () => {
    procedure("show.details").mockRejectedValueOnce(
      failure("BAD_REQUEST", "Please provide show token"),
    );
    await renderShow();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(await findTitle()).toBeOnTheScreen();
  });
});
