import type {
  AllSearch,
  ArtistSearch,
  SearchReturnType,
} from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import type { ReactElement } from "react";
import { Text } from "react-native";

import { playerStore } from "~/playback/player-store";

import { IdleSearch } from "./idle-search";
import { allSearch, topSearches } from "./search-fixtures";
import { searchHistoryStore } from "./search-history";
import { SearchResults } from "./search-results";

const mockTop = jest.fn();
const mockAll = jest.fn();
const mockByType = jest.fn();

// A declaration, not a const: the factory runs while the imports load.
function mockProcedure(name: string, run: (input: unknown) => unknown) {
  return {
    queryOptions: (input?: unknown) => ({
      queryKey: [name, input],
      queryFn: () => run(input),
    }),
    pathKey: () => [name],
  };
}

jest.mock("~/lib/trpc", () => {
  const base = require("~/test/trpc-mock");
  return {
    trpc: {
      ...base.trpc,
      search: {
        top: mockProcedure("search.top", (input) => mockTop(input)),
        all: mockProcedure("search.all", (input) => mockAll(input)),
        byType: mockProcedure("search.byType", (input) => mockByType(input)),
      },
    },
    trpcClient: {
      ...base.trpcClient,
      search: { byType: { query: (input: unknown) => mockByType(input) } },
    },
  };
});
jest.mock("~/components/ui/skeleton", () => require("./plain-skeleton"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));

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
  return renderRouter({
    index: () => (
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
    "song/[token]": () => null,
    "album/[token]": () => null,
    "show/[token]": () => null,
  });
}

function page<T extends SearchReturnType["results"][number]>(
  results: T[],
  total = results.length,
) {
  return { total, start: 0, results };
}

const notFound = Object.assign(new Error("No search results found"), {
  data: { code: "NOT_FOUND" },
});

function renderResults(
  props: Partial<Parameters<typeof SearchResults>[0]> = {},
) {
  return renderSearch(
    <SearchResults
      query="fa9la"
      type="all"
      header={chips}
      onShowType={jest.fn()}
      onSearchArtist={jest.fn()}
      {...props}
    />,
  );
}

describe("combined search results", () => {
  it("keeps the chips on screen while loading", async () => {
    mockAll.mockReturnValue(new Promise(() => {}));
    await renderResults();

    expect(screen.getByText("chips")).toBeOnTheScreen();
    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(screen.queryByText("Top Result")).toBeNull();
  });

  it("groups the results, decoding titles", async () => {
    mockAll.mockResolvedValue(allSearch);
    await renderResults();

    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Udta Teer")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Albums" })).toBeOnTheScreen();
    expect(screen.queryByText("Playlists")).toBeNull();
    expect(mockAll).toHaveBeenCalledWith({ q: "fa9la" });
  });

  it("opens a song's page instead of queueing it (it has no media link)", async () => {
    mockAll.mockResolvedValue(allSearch);
    const router = await renderResults();

    await fireEvent.press(await screen.findByText("FA9LA & Friends"));

    expect(router.getPathname()).toBe("/song/BSaNI3Yr");
    expect(playerStore.getState().queue).toEqual([]);
  });

  it("searches an artist by name, as they have no page of their own", async () => {
    mockAll.mockResolvedValue(allSearch);
    const onSearchArtist = jest.fn();
    await renderResults({ onSearchArtist });

    await fireEvent.press(
      (await screen.findAllByRole("button", { name: "Flipperachi" }))[0],
    );

    expect(onSearchArtist).toHaveBeenCalledWith("Flipperachi");
  });

  it("switches to the full list from See All", async () => {
    mockAll.mockResolvedValue(allSearch);
    const onShowType = jest.fn();
    await renderResults({ onShowType });

    await fireEvent.press(
      await screen.findByRole("button", { name: "See all Songs" }),
    );

    expect(onShowType).toHaveBeenCalledWith("song");
  });

  it.each<[string, () => void]>([
    ["null", () => mockAll.mockResolvedValue(null)],
    ["NOT_FOUND", () => mockAll.mockRejectedValue(notFound)],
    [
      "groups without items",
      () =>
        mockAll.mockResolvedValue({
          ...allSearch,
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
    mockAll.mockRejectedValueOnce(new Error("offline"));
    await renderResults();

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();

    mockAll.mockResolvedValue(allSearch);
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Top Result")).toBeOnTheScreen();
  });
});

describe("results of one type", () => {
  it("plays a song's list from the pressed row", async () => {
    const songs = [
      rawSong(),
      rawSong({ id: "second", title: "Second &amp; Last" }),
    ];
    mockByType.mockResolvedValue(page(songs));
    await renderResults({ type: "song" });

    await fireEvent.press(
      await screen.findByRole("button", { name: "Second & Last" }),
    );

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "BSaNI3Yr",
      "second",
    ]);
    expect(playerStore.getState().currentIndex).toBe(1);
    expect(mockByType).toHaveBeenCalledWith({
      q: "fa9la",
      type: "songs",
      page: 1,
      n: 50,
    });
  });

  it("opens an album from its card", async () => {
    mockByType.mockResolvedValue(page([rawAlbum()]));
    const router = await renderResults({ type: "album" });

    await fireEvent.press(await screen.findByText("Udta Teer"));

    expect(router.getPathname()).toBe("/album/LHgqn,SRpyA_");
    expect(mockByType).toHaveBeenCalledWith(
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
    mockByType.mockResolvedValue(page([artist]));
    await renderResults({ type: "artist" });

    expect(await screen.findByText("Flipperachi")).toBeOnTheScreen();
    expect(screen.getByText("Artist")).toBeOnTheScreen();
  });

  it.each(["song", "album", "playlist", "artist", "show"] as const)(
    "treats NOT_FOUND as no results for %s",
    async (type) => {
      mockByType.mockRejectedValue(notFound);
      await renderResults({ type, query: "zzzz" });

      expect(await screen.findByText("No results found")).toBeOnTheScreen();
      expect(screen.queryByText("Couldn't load this")).toBeNull();
    },
  );

  it("offers a retry when the list fails to load", async () => {
    mockByType.mockRejectedValueOnce(new Error("offline"));
    await renderResults({ type: "album" });

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();

    mockByType.mockResolvedValue(page([rawAlbum()]));
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Udta Teer")).toBeOnTheScreen();
  });
});

describe("idle search", () => {
  it("lists the top searches and opens one", async () => {
    mockTop.mockResolvedValue(topSearches);
    const router = await renderSearch(
      <IdleSearch onSelectRecent={jest.fn()} />,
    );

    await fireEvent.press(await screen.findByText("Rock & Roll"));

    expect(router.getPathname()).toBe("/album/LHgqn,SRpyA_");
  });

  it("leaves out a top-searches list that fails", async () => {
    mockTop.mockRejectedValue(new Error("offline"));
    await renderSearch(<IdleSearch onSelectRecent={jest.fn()} />);

    await waitFor(() => expect(mockTop).toHaveBeenCalled());
    expect(screen.queryByText("Top Searches")).toBeNull();
    expect(screen.queryByText("Couldn't load this")).toBeNull();
  });

  it("searches a recent query again, and clears the history", async () => {
    mockTop.mockResolvedValue([]);
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
