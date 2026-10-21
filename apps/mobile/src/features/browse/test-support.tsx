/**
 * Test doubles for the catalog screens (`jest.mock("~/lib/trpc", () =>
 * require("~/features/browse/test-support").trpcMock)`): every catalog
 * procedure is a `jest.fn` (`procedure("get.charts")`) that both the `trpc`
 * query options and the imperative `trpcClient` call. Raw-shape fixtures and
 * `renderScreenAt` sit beside it.
 */
import type {
  Chart,
  Modules,
  Playlist,
  Radio,
  StationDetailsResponse,
} from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderRouter } from "expo-router/testing-library";
import type { ComponentType, ReactElement } from "react";

import * as userMock from "~/test/trpc-mock";

type Procedure = jest.Mock<Promise<unknown>, [unknown]>;

const PROCEDURES = [
  "home.home",
  "get.topAlbums",
  "get.charts",
  "get.featuredPlaylists",
  "get.topShows",
  "get.topArtists",
  "get.featuredStations",
  "get.trending",
  "playlist.details",
  "radio.stationDetails",
  "radio.createStation",
  "radio.songs",
] as const;

type ProcedurePath = (typeof PROCEDURES)[number];

const procedures = new Map<string, Procedure>(
  PROCEDURES.map((path) => [path, jest.fn()]),
);

/** The mocked procedure at `path`; set its answer with `mockResolvedValue`. */
export function procedure(path: ProcedurePath): Procedure {
  const found = procedures.get(path);
  if (!found) throw new Error(`No mocked procedure ${path}`);
  return found;
}

function queryApi(path: ProcedurePath) {
  const segments = path.split(".");
  return {
    pathKey: () => [segments],
    queryOptions: (input: unknown) => ({
      queryKey: [segments, { input, type: "query" }],
      queryFn: () => procedure(path)(input),
    }),
  };
}

function clientApi(path: ProcedurePath) {
  return {
    query: (input: unknown) => procedure(path)(input),
    mutate: (input: unknown) => procedure(path)(input),
  };
}

export const trpcMock = {
  trpc: {
    ...userMock.trpc,
    home: { home: queryApi("home.home") },
    get: {
      topAlbums: queryApi("get.topAlbums"),
      charts: queryApi("get.charts"),
      featuredPlaylists: queryApi("get.featuredPlaylists"),
      topShows: queryApi("get.topShows"),
      topArtists: queryApi("get.topArtists"),
      featuredStations: queryApi("get.featuredStations"),
    },
    radio: { stationDetails: queryApi("radio.stationDetails") },
  },
  trpcClient: {
    ...userMock.trpcClient,
    home: { home: clientApi("home.home") },
    get: {
      topAlbums: clientApi("get.topAlbums"),
      charts: clientApi("get.charts"),
      featuredPlaylists: clientApi("get.featuredPlaylists"),
      topShows: clientApi("get.topShows"),
      topArtists: clientApi("get.topArtists"),
      featuredStations: clientApi("get.featuredStations"),
      trending: clientApi("get.trending"),
    },
    playlist: { details: clientApi("playlist.details") },
    radio: {
      stationDetails: clientApi("radio.stationDetails"),
      createStation: clientApi("radio.createStation"),
      songs: clientApi("radio.songs"),
    },
  },
};

export function rawStation(overrides: Partial<Radio> = {}): Radio {
  const id = overrides.id ?? "station-1";
  return {
    id,
    title: "Hindi Hits &amp; More",
    subtitle: "Hindi Radio",
    type: "radio_station",
    image: "https://c.saavncdn.com/radio/hindi-hits-150x150.jpg?bch=1",
    perma_url: `https://www.saavn.com/s/radio/hindi-featured-station/${id}`,
    explicit_content: "0",
    more_info: {
      featured_station_type: "featured",
      language: "hindi",
      station_display_text: "Hindi Hits",
      query: "",
    },
    ...overrides,
  };
}

export function rawStationDetails(
  overrides: Partial<StationDetailsResponse> = {},
): StationDetailsResponse {
  return {
    station: rawStation(),
    stationId: "session-42",
    songs: [rawSong(), rawSong({ id: "Ab12Cd34", title: "Second Song" })],
    ...overrides,
  };
}

export function rawChart(overrides: Partial<Chart> = {}): Chart {
  const id = overrides.id ?? "chart-1";
  return {
    id,
    title: "Top 15 Hindi &amp; Punjabi",
    subtitle: "JioSaavn",
    type: "playlist",
    image: "https://c.saavncdn.com/charts/top15-150x150.jpg",
    perma_url: `https://www.jiosaavn.com/featured/top-15-hindi/${id}`,
    explicit_content: "0",
    ...overrides,
  };
}

export function rawPlaylist(overrides: Partial<Playlist> = {}): Playlist {
  const id = overrides.id ?? "playlist-1";
  return {
    id,
    title: "Best of Arijit",
    subtitle: "Arijit Singh",
    type: "playlist",
    perma_url: `https://www.jiosaavn.com/featured/best-of-arijit/${id}`,
    image: "https://c.saavncdn.com/playlists/arijit-150x150.jpg",
    language: "hindi",
    explicit_content: "0",
    list_type: "song",
    more_info: {
      uid: "1",
      is_dolby_content: false,
      username: "saavn",
      firstname: "JioSaavn",
      lastname: "",
      playlist_type: "default",
      subtitle_desc: [],
    },
    ...overrides,
  };
}

/** A launch-data payload with the typed sections and one untyped, titled section. */
export function rawLaunchData(overrides: Partial<Modules> = {}): Modules {
  return {
    new_albums: [rawAlbum()],
    new_trending: [],
    browse_discover: [],
    charts: [rawChart()],
    radio: [rawStation()],
    top_playlists: [
      rawPlaylist({ id: "p1", title: "Featured Mix" }),
      rawPlaylist({ id: "p2", title: "Second Playlist" }),
    ],
    global_config: {
      random_songs_listid: {},
      weekly_top_songs_listid: {},
    },
    modules: {
      new_albums: {
        source: "new_albums",
        position: 1,
        title: "New Releases",
        subtitle: "",
      },
      charts: { source: "charts", position: 2, title: "Charts", subtitle: "" },
      radio: {
        source: "radio",
        position: 3,
        title: "Radio Stations",
        subtitle: "",
      },
    },
    ...overrides,
  };
}

type ScreenOptions = {
  initialUrl?: string;
  /** Other routes the screen can navigate to, as `renderRouter` files. */
  routes?: Record<string, ComponentType>;
};

/** Renders `ui` as the index route of an in-memory router with a fresh, non-retrying query cache. */
export function renderScreenAt(
  ui: ReactElement,
  { initialUrl = "/", routes = {} }: ScreenOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return renderRouter(
    {
      index: () => (
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      ),
      ...routes,
    },
    { initialUrl },
  );
}
