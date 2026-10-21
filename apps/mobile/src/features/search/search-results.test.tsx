import type {
  AllSearch,
  ArtistSearch,
  SearchReturnType,
} from "@infinitunes/types";
import {
  rawAllSearch,
  rawTopSearches,
  rawSong,
  rawAlbum,
} from "@infinitunes/types/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement } from "react";
import { Text } from "react-native";

import { playerStore } from "~/playback/player-store";
import { procedure, trpcError } from "~/test/trpc-mock";

import { IdleSearch } from "./idle-search";
import { searchHistoryStore } from "./search-history";
import { SearchResults } from "./search-results";

const initialPlayer = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  searchHistoryStore.setState({ queries: [] });
});

const chips = <Text>chips</Text>;

function renderSearch(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  // Inside a `(tabs)` group, as in the app: entities push onto the tab's stack.
  return renderRouter({
    _layout: () => <Stack />,
    "(tabs)/_layout": () => <Stack />,
    "(tabs)/index": () => (
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
    "(tabs)/song/[name]/[token]": () => null,
    "(tabs)/album/[name]/[token]": () => null,
  });
}

function page<T extends SearchReturnType["results"][number]>(
  results: T[],
  total = results.length,
) {
  return { total, start: 0, results };
}

const notFound = trpcError("NOT_FOUND", "No search results found");

function renderResults(
  props: Partial<Parameters<typeof SearchResults>[0]> = {},
) {
  return renderSearch(
    <SearchResults
      query="fa9la"
      type="all"
      header={chips}
      onShowType={jest.fn()}
      onOpenResult={jest.fn()}
      onSearchArtist={jest.fn()}
      {...props}
    />,
  );
}

describe("combined search results", () => {
  it("keeps the chips on screen while loading", async () => {
    procedure("search.all").mockReturnValue(new Promise(() => {}));
    await renderResults();

    expect(screen.getByText("chips")).toBeOnTheScreen();
    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(screen.queryByText("Top Result")).toBeNull();
  });

  it("groups the results, decoding titles", async () => {
    procedure("search.all").mockResolvedValue(rawAllSearch);
    await renderResults();

    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Albums" })).toBeOnTheScreen();
    expect(screen.queryByText("Playlists")).toBeNull();
    expect(procedure("search.all")).toHaveBeenCalledWith({ q: "fa9la" });
  });

  it("opens a song's page instead of queueing it (it has no media link)", async () => {
    procedure("search.all").mockResolvedValue(rawAllSearch);
    const onOpenResult = jest.fn();
    const router = await renderResults({ onOpenResult });

    await fireEvent.press(await screen.findByText("FA9LA & Friends"));

    expect(router.getPathname()).toBe("/song/fa9la/BSaNI3Yr");
    expect(onOpenResult).toHaveBeenCalledTimes(1);
    expect(playerStore.getState().queue).toEqual([]);
  });

  it("plays a linked top result from its Play button", async () => {
    // No top query or artist match: the first album is the top result.
    procedure("search.all").mockResolvedValue({
      ...rawAllSearch,
      topquery: { position: 1, data: [] },
      artists: { position: 4, data: [] },
    });
    procedure("album.details").mockResolvedValue(
      rawAlbum({ list: [rawSong()] }),
    );
    await renderResults();

    const [play] = await screen.findAllByRole("button", {
      name: "Play Udta Teer",
    });
    if (!play) throw new Error("no Play on the top result");
    await fireEvent.press(play);

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(1));
    expect(procedure("album.details")).toHaveBeenCalledWith({
      token: "LHgqn,SRpyA_",
    });
  });

  it("offers no Play for a top result without a page", async () => {
    procedure("search.all").mockResolvedValue(rawAllSearch);
    await renderResults();

    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Play Flipperachi" }),
    ).toBeNull();
  });

  it("remembers the search when a shelf card opens its page", async () => {
    procedure("search.all").mockResolvedValue(rawAllSearch);
    const onOpenResult = jest.fn();
    const router = await renderResults({ onOpenResult });

    await fireEvent.press(
      await screen.findByRole("link", { name: "Udta Teer, Sachin-Jigar" }),
    );

    expect(router.getPathname()).toBe("/album/udta-teer/LHgqn,SRpyA_");
    expect(onOpenResult).toHaveBeenCalledTimes(1);
  });

  it("searches an artist by name, as they have no page of their own", async () => {
    procedure("search.all").mockResolvedValue(rawAllSearch);
    const onSearchArtist = jest.fn();
    await renderResults({ onSearchArtist });

    await fireEvent.press(
      (await screen.findAllByRole("button", { name: "Flipperachi" }))[0],
    );

    expect(onSearchArtist).toHaveBeenCalledWith("Flipperachi");
  });

  it("switches to the full list from See All", async () => {
    procedure("search.all").mockResolvedValue(rawAllSearch);
    const onShowType = jest.fn();
    await renderResults({ onShowType });

    await fireEvent.press(
      await screen.findByRole("button", { name: "See all Songs" }),
    );

    expect(onShowType).toHaveBeenCalledWith("song");
  });

  it.each<[string, () => void]>([
    ["null", () => procedure("search.all").mockResolvedValue(null)],
    ["NOT_FOUND", () => procedure("search.all").mockRejectedValue(notFound)],
    [
      "groups without items",
      () =>
        procedure("search.all").mockResolvedValue({
          ...rawAllSearch,
          topquery: { position: 1, data: [] },
          songs: { position: 2, data: [] },
          albums: { position: 3, data: [] },
          artists: { position: 4, data: [] },
        } satisfies AllSearch),
    ],
  ])("says nothing matched for %s", async (_name, arrange) => {
    arrange();
    await renderResults({ query: "zzzz" });

    expect(await screen.findByText("No results found")).toBeOnTheScreen();
    expect(screen.getByText(/Nothing matched "zzzz"/)).toBeOnTheScreen();
  });

  it("offers a retry when the search fails", async () => {
    procedure("search.all").mockRejectedValueOnce(new Error("offline"));
    await renderResults();

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();

    procedure("search.all").mockResolvedValue(rawAllSearch);
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
  });
});

describe("results of one type", () => {
  it("says when the last page is in, and not before", async () => {
    procedure("search.byType").mockResolvedValue(page([rawSong()]));
    await renderResults({ type: "song" });

    expect(
      await screen.findByText("You have reached the end of these results."),
    ).toBeOnTheScreen();
  });

  it("keeps the end note off while more pages remain", async () => {
    procedure("search.byType").mockResolvedValue(page([rawSong()], 120));
    await renderResults({ type: "song" });

    expect(await screen.findByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(
      screen.queryByText("You have reached the end of these results."),
    ).toBeNull();
  });

  it("plays a song's list from the pressed row", async () => {
    const songs = [
      rawSong(),
      rawSong({ id: "second", title: "Second &amp; Last" }),
    ];
    procedure("search.byType").mockResolvedValue(page(songs));
    const onOpenResult = jest.fn();
    await renderResults({ type: "song", onOpenResult });

    await fireEvent.press(
      await screen.findByRole("button", { name: "Second & Last" }),
    );

    expect(onOpenResult).toHaveBeenCalledTimes(1);

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "BSaNI3Yr",
      "second",
    ]);
    expect(playerStore.getState().currentIndex).toBe(1);
    expect(procedure("search.byType")).toHaveBeenCalledWith({
      q: "fa9la",
      type: "songs",
      page: 1,
      n: 50,
    });
  });

  it("opens an album from its card", async () => {
    procedure("search.byType").mockResolvedValue(page([rawAlbum()]));
    const router = await renderResults({ type: "album" });

    await fireEvent.press(await screen.findByText("Udta Teer"));

    expect(router.getPathname()).toBe("/album/udta-teer/LHgqn,SRpyA_");
    expect(procedure("search.byType")).toHaveBeenCalledWith(
      expect.objectContaining({ type: "albums" }),
    );
  });

  it("shows an artist by name with their role", async () => {
    const artist: ArtistSearch["results"][number] = {
      id: "2393548",
      name: "Flipperachi",
      ctr: 0,
      entity: 1,
      image: "https://c.saavncdn.com/artists/Flipperachi_000_150x150.jpg",
      role: "Artist",
      perma_url:
        "https://www.jiosaavn.com/artist/flipperachi-songs/LnMfdXjMGl0_",
      type: "artist",
      isRadioPresent: true,
      is_followed: false,
    };
    procedure("search.byType").mockResolvedValue(page([artist]));
    await renderResults({ type: "artist" });

    expect(await screen.findByText("Flipperachi")).toBeOnTheScreen();
    expect(screen.getByText("Artist")).toBeOnTheScreen();
  });

  it.each(["song", "album", "playlist", "artist", "show"] as const)(
    "treats NOT_FOUND as no results for %s",
    async (type) => {
      procedure("search.byType").mockRejectedValue(notFound);
      await renderResults({ type, query: "zzzz" });

      expect(await screen.findByText("No results found")).toBeOnTheScreen();
      expect(screen.queryByText("Couldn't load this")).toBeNull();
    },
  );

  it("offers a retry when the list fails to load", async () => {
    procedure("search.byType").mockRejectedValueOnce(new Error("offline"));
    await renderResults({ type: "album" });

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();

    procedure("search.byType").mockResolvedValue(page([rawAlbum()]));
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
  });
});

describe("idle search", () => {
  it("lists the top searches and opens one", async () => {
    procedure("search.top").mockResolvedValue(rawTopSearches);
    const router = await renderSearch(
      <IdleSearch onSelectRecent={jest.fn()} />,
    );

    await fireEvent.press(await screen.findByText("Rock & Roll"));

    expect(router.getPathname()).toBe("/album/rock-roll/LHgqn,SRpyA_");
  });

  it("leaves out a top-searches list that fails", async () => {
    procedure("search.top").mockRejectedValue(new Error("offline"));
    await renderSearch(<IdleSearch onSelectRecent={jest.fn()} />);

    await waitFor(() => expect(procedure("search.top")).toHaveBeenCalled());
    expect(screen.queryByText("Top Searches")).toBeNull();
    expect(screen.queryByText("Couldn't load this")).toBeNull();
  });

  it("searches a recent query again, and clears the history", async () => {
    procedure("search.top").mockResolvedValue([]);
    searchHistoryStore.getState().add("lofi");
    searchHistoryStore.getState().add("arijit");
    const onSelectRecent = jest.fn();
    await renderSearch(<IdleSearch onSelectRecent={onSelectRecent} />);

    expect(screen.getByText("Recent Searches")).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Search for lofi" }),
    );
    expect(onSelectRecent).toHaveBeenCalledWith("lofi");

    await fireEvent.press(
      screen.getByRole("button", { name: "Clear recent searches" }),
    );
    expect(screen.queryByText("Recent Searches")).toBeNull();
  });
});
