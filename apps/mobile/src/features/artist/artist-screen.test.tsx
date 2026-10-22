import {
  rawArtist,
  ARTIST_TOKEN,
  artistSongsPage,
  artistAlbumsPage,
} from "@infinitunes/types/fixtures";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure, trpcError } from "~/test/trpc-mock";

import { ArtistScreen } from "./artist-screen";

const initialPlayer = playerStore.getState();

function renderArtist() {
  return renderScreen(
    <ArtistScreen token={ARTIST_TOKEN} initialTab="overview" />,
    {
      routes: {
        "album/[name]/[token]": () => null,
        "artist/[name]/[token]/[tab]": () => null,
      },
    },
  );
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

function selectSort(category: string) {
  return fireEvent(screen.getByTestId("artist-sort"), "pressAction", {
    nativeEvent: { event: category },
  });
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  procedure("artist.details").mockResolvedValue(rawArtist());
  procedure("artist.songs").mockResolvedValue(
    artistSongsPage(["s1", "s2"], true),
  );
  procedure("artist.albums").mockResolvedValue(artistAlbumsPage(["a1"], true));
});

describe("ArtistScreen", () => {
  it("shows a skeleton while the artist loads", async () => {
    procedure("artist.details").mockReturnValue(new Promise(() => {}));
    await renderArtist();

    expect(
      screen.getAllByRole("progressbar", { name: "Loading" }).length,
    ).toBeGreaterThan(0);
  });

  it("asks for the artist by route token", async () => {
    await renderArtist();
    await findTitle();

    expect(procedure("artist.details")).toHaveBeenCalledWith({
      token: ARTIST_TOKEN,
      n_song: 50,
      n_album: 50,
    });
  });

  it("shows the artist, their top songs and shelves on the Overview", async () => {
    await renderArtist();

    expect(await findTitle()).toBeOnTheScreen();
    expect(screen.getByText("48.2K Listeners")).toBeOnTheScreen();
    expect(screen.getByLabelText("Verified")).toBeOnTheScreen();
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

    expect(app.getPathname()).toBe("/artist/fadi-aymen/RbVfsAk3Sd8_/songs");
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
    expect(procedure("artist.songs")).toHaveBeenCalledWith({
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

    await selectSort("latest");

    await screen.findByText("Song s1");
    expect(procedure("artist.songs")).toHaveBeenLastCalledWith({
      id: "2393548",
      page: 0,
      cat: "latest",
      sort: "desc",
    });
  });

  it("pages on when the list ends, until upstream says it is the last page", async () => {
    procedure("artist.songs")
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
    expect(procedure("artist.songs")).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );

    await act(async () => {
      fireEvent(screen.getByTestId("artist-list"), "endReached");
    });
    expect(procedure("artist.songs")).toHaveBeenCalledTimes(2);
  });

  it("refreshes the artist and the open list on pull to refresh", async () => {
    await renderArtist();
    await findTitle();
    await selectTab("Songs");
    await screen.findByText("Song s1");

    await act(async () => {
      fireEvent(screen.getByTestId("artist-list"), "refresh");
    });

    await waitFor(() =>
      expect(procedure("artist.details")).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(procedure("artist.songs")).toHaveBeenCalledTimes(2),
    );
  });

  it("lists albums as rows that open the album", async () => {
    const app = await renderArtist();
    await findTitle();
    await selectTab("Albums");

    await fireEvent.press(await screen.findByText("Album a1"));

    expect(app.getPathname()).toBe("/album/album-a1/toka1");
  });

  it("says so when a tab has nothing to list", async () => {
    procedure("artist.songs").mockResolvedValue({
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
    procedure("artist.details").mockResolvedValue(rawArtist({ bio: "" }));
    await renderArtist();
    await findTitle();

    expect(segmentLabels("artist-tabs")).toEqual([
      "Overview",
      "Songs",
      "Albums",
    ]);
  });

  it("shows not found for an unknown artist, without a retry", async () => {
    procedure("artist.details").mockRejectedValue(
      trpcError("NOT_FOUND", "Artist not found, please check the id or token"),
    );
    await renderArtist();

    expect(await screen.findByText("Artist not found")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(procedure("artist.details")).toHaveBeenCalledTimes(1);
  });

  it("offers a retry when loading fails", async () => {
    procedure("artist.details").mockRejectedValueOnce(
      trpcError("BAD_REQUEST", "Please provide Artist id or token"),
    );
    await renderArtist();

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await findTitle()).toBeOnTheScreen();
  });
});
