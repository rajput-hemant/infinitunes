import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import { playerStore } from "~/playback/player-store";

import { ArtistScreen } from "./artist-screen";
import { retryTransient } from "./detail-query";
import {
  ARTIST_TOKEN,
  artistAlbumsPage,
  artistSongsPage,
  rawArtist,
} from "./test-fixtures";
import { artistAnswers } from "./test-trpc";

jest.mock("~/lib/trpc", () => require("~/features/artist/test-trpc"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/artist/test-skeleton"),
);

const initialPlayer = playerStore.getState();

function renderArtist() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  return renderRouter({
    index: () => (
      <QueryClientProvider client={queryClient}>
        <ArtistScreen token={ARTIST_TOKEN} />
      </QueryClientProvider>
    ),
    "album/[token]": () => null,
    "artist/[token]": () => null,
  });
}

function findTitle() {
  return screen.findByRole("header", { name: "Flipperachi" });
}

/** The segment titles of a native segmented control, read from its rendered picker. */
function segmentLabels(testID: string) {
  const [content] = screen.getByTestId(testID).children;
  return typeof content === "string"
    ? []
    : content.children.map((segment) =>
        typeof segment === "string" ? segment : segment.props.text,
      );
}

function selectTab(label: "Overview" | "Songs" | "Albums" | "Biography") {
  const index = ["Overview", "Songs", "Albums", "Biography"].indexOf(label);
  return fireEvent(screen.getByTestId("artist-tabs"), "onChange", {
    nativeEvent: { selectedSegmentIndex: index, value: label },
  });
}

function selectSort(index: number) {
  return fireEvent(screen.getByTestId("artist-sort"), "onChange", {
    nativeEvent: { selectedSegmentIndex: index, value: "" },
  });
}

function failure(code: string, message: string) {
  return Object.assign(new Error(message), { data: { code } });
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  artistAnswers.details.mockResolvedValue(rawArtist());
  artistAnswers.songs.mockResolvedValue(artistSongsPage(["s1", "s2"], true));
  artistAnswers.albums.mockResolvedValue(artistAlbumsPage(["a1"], true));
});

describe("ArtistScreen", () => {
  it("shows a skeleton while the artist loads", async () => {
    artistAnswers.details.mockReturnValue(new Promise(() => {}));
    await renderArtist();

    expect(
      screen.getAllByRole("progressbar", { name: "Loading" }).length,
    ).toBeGreaterThan(0);
  });

  it("asks for the artist by route token", async () => {
    await renderArtist();
    await findTitle();

    expect(artistAnswers.details).toHaveBeenCalledWith({
      token: ARTIST_TOKEN,
      n_song: 50,
      n_album: 50,
    });
  });

  it("shows the artist, their top songs and shelves on the Overview", async () => {
    await renderArtist();

    expect(await findTitle()).toBeOnTheScreen();
    expect(screen.getByText("48.2K Listeners")).toBeOnTheScreen();
    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Second Song")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Top Albums" }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Singles" })).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Similar Artists" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Fadi Aymen & Co")).toBeOnTheScreen();
    expect(segmentLabels("artist-tabs")).toEqual([
      "Overview",
      "Songs",
      "Albums",
      "Biography",
    ]);
  });

  it("opens a similar artist by its own token", async () => {
    const app = await renderArtist();
    await fireEvent.press(await screen.findByText("Fadi Aymen & Co"));

    expect(app.getPathname()).toBe("/artist/RbVfsAk3Sd8_");
  });

  it("queues the top songs from the pressed row", async () => {
    await renderArtist();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Second Song" }),
    );

    const { queue, currentIndex } = playerStore.getState();
    expect(queue.map((entry) => entry.name)).toEqual([
      "FA9LA & Friends",
      "Second Song",
    ]);
    expect(currentIndex).toBe(1);
  });

  it("plays and shuffles the top songs from the header", async () => {
    await renderArtist();

    await fireEvent.press(await screen.findByRole("button", { name: "Play" }));
    expect(playerStore.getState().queue).toHaveLength(2);
    expect(playerStore.getState().currentIndex).toBe(0);

    await fireEvent.press(screen.getByRole("button", { name: "Shuffle" }));
    expect(playerStore.getState().queue).toHaveLength(2);
  });

  it("keeps the header while the Songs tab loads its pages", async () => {
    await renderArtist();
    await findTitle();

    await selectTab("Songs");

    expect(await screen.findByText("Song s1")).toBeOnTheScreen();
    expect(screen.getByText("Song s2")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Flipperachi" }),
    ).toBeOnTheScreen();
    expect(artistAnswers.songs).toHaveBeenCalledWith({
      id: "2393548",
      page: 0,
      cat: undefined,
      sort: "asc",
    });
  });

  it("refetches the Songs tab in the chosen order from the first page", async () => {
    await renderArtist();
    await findTitle();
    await selectTab("Songs");
    await screen.findByText("Song s1");

    await selectSort(1);

    await screen.findByText("Song s1");
    expect(artistAnswers.songs).toHaveBeenLastCalledWith({
      id: "2393548",
      page: 0,
      cat: "latest",
      sort: "desc",
    });
  });

  it("pages on when the list ends, until upstream says it is the last page", async () => {
    artistAnswers.songs
      .mockResolvedValueOnce(artistSongsPage(["s1", "s2"]))
      .mockResolvedValueOnce(artistSongsPage(["s2", "s3"], true));
    await renderArtist();
    await findTitle();
    await selectTab("Songs");
    await screen.findByText("Song s1");

    await act(async () => {
      fireEvent(screen.getByTestId("artist-list"), "endReached");
    });

    expect(await screen.findByText("Song s3")).toBeOnTheScreen();
    expect(screen.getAllByText("Song s2")).toHaveLength(1);
    expect(artistAnswers.songs).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );

    await act(async () => {
      fireEvent(screen.getByTestId("artist-list"), "endReached");
    });
    expect(artistAnswers.songs).toHaveBeenCalledTimes(2);
  });

  it("lists albums as rows that open the album", async () => {
    const app = await renderArtist();
    await findTitle();
    await selectTab("Albums");

    await fireEvent.press(await screen.findByText("Album a1"));

    expect(app.getPathname()).toBe("/album/toka1");
  });

  it("says so when a tab has nothing to list", async () => {
    artistAnswers.songs.mockResolvedValue({
      topSongs: { songs: [], last_page: true, total: 0 },
    });
    await renderArtist();
    await findTitle();
    await selectTab("Songs");

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
  });

  it("shows the biography as plain text sections", async () => {
    await renderArtist();
    await findTitle();
    await selectTab("Biography");

    expect(
      screen.getByRole("header", { name: "Early life" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Born in Dubai.")).toBeOnTheScreen();
    expect(screen.getByText("Started rapping at 15.")).toBeOnTheScreen();
  });

  it("hides the Biography tab for an artist without one", async () => {
    artistAnswers.details.mockResolvedValue(rawArtist({ bio: "" }));
    await renderArtist();
    await findTitle();

    expect(segmentLabels("artist-tabs")).toEqual([
      "Overview",
      "Songs",
      "Albums",
    ]);
  });

  it("shows not found for an unknown artist, without a retry", async () => {
    artistAnswers.details.mockRejectedValue(
      failure("NOT_FOUND", "Artist not found, please check the id or token"),
    );
    await renderArtist();

    expect(await screen.findByText("Artist not found")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(artistAnswers.details).toHaveBeenCalledTimes(1);
  });

  it("offers a retry when loading fails", async () => {
    artistAnswers.details.mockRejectedValueOnce(
      failure("BAD_REQUEST", "Please provide Artist id or token"),
    );
    await renderArtist();

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await findTitle()).toBeOnTheScreen();
  });
});

describe("retryTransient", () => {
  it("retries upstream failures up to three times", () => {
    const upstream = failure("BAD_GATEWAY", "upstream");
    expect(retryTransient(0, upstream)).toBe(true);
    expect(retryTransient(2, upstream)).toBe(true);
    expect(retryTransient(3, upstream)).toBe(false);
  });

  it("does not retry a missing entity", () => {
    expect(retryTransient(0, failure("NOT_FOUND", "missing"))).toBe(false);
  });
});
