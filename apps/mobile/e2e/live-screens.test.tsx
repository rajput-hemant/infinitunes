import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every catalog screen rendered on LIVE upstream payloads instead of the
 * fixtures: the responses `catalog.e2e.ts` dumped. Skipped unless
 * MOBILE_E2E_LIVE_DIR names that dump folder:
 *   MOBILE_E2E_LIVE_DIR=/tmp/live bunx jest e2e/live-screens
 */
import { decode, parseToken } from "@infinitunes/types";
import { screen, waitFor } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Text } from "react-native";

import { AlbumScreen } from "~/features/album/album-screen";
import { ArtistScreen } from "~/features/artist/artist-screen";
import { FeaturedPlaylistsScreen } from "~/features/browse/featured-playlists-screen";
import { TopAlbumsScreen } from "~/features/browse/top-albums-screen";
import { TopArtistsScreen } from "~/features/browse/top-artists-screen";
import { TopPodcastsScreen } from "~/features/browse/top-podcasts-screen";
import { TopChartsScreen } from "~/features/charts/top-charts-screen";
import { EpisodeScreen } from "~/features/episode/episode-screen";
import { HomeFeed } from "~/features/home/home-feed";
import { LabelScreen } from "~/features/label/label-screen";
import { PlaylistScreen } from "~/features/playlist/playlist-screen";
import { FeaturedStationsScreen } from "~/features/radio/featured-stations-screen";
import { StationScreen } from "~/features/radio/station-screen";
import { SearchResults } from "~/features/search/search-results";
import type { ListSearchType } from "~/features/search/search-types";
import { ShowScreen } from "~/features/show/show-screen";
import { SongScreen } from "~/features/song/song-screen";
import { stationRef } from "~/navigation/entity-href";
import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";
import type { ProcedurePath } from "~/test/trpc-mock";

const DIR = process.env.MOBILE_E2E_LIVE_DIR ?? "";

// oxlint-disable-next-line typescript/no-explicit-any -- raw dumped JSON
type Json = any;

function live(name: string): Json {
  return JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8"));
}

const PATHS: ProcedurePath[] = [
  "home.home",
  "search.top",
  "search.all",
  "search.byType",
  "get.trending",
  "get.charts",
  "get.featuredPlaylists",
  "get.featuredStations",
  "get.topArtists",
  "get.topAlbums",
  "get.topShows",
  "song.details",
  "song.recommendations",
  "song.items",
  "get.lyrics",
  "artist.topSongs",
  "get.actorTopSongs",
  "album.details",
  "album.recommendations",
  "album.sameYear",
  "artist.details",
  "artist.songs",
  "artist.albums",
  "playlist.details",
  "playlist.recommendations",
  "show.details",
  "show.episodes",
  "show.episodeDetails",
  "get.label",
  "radio.stationDetails",
  "radio.songs",
];

/** The dump for a call: `get.trending.album` for `{ type: "album" }`. */
function answer(path: string, input: unknown) {
  const type =
    typeof input === "object" && input !== null && "type" in input
      ? String(input.type)
      : path === "get.trending"
        ? "song"
        : undefined;
  const variant = type ? `${path}.${type}` : path;
  return live(existsSync(join(DIR, `${variant}.json`)) ? variant : path);
}

beforeEach(() => {
  for (const path of PATHS) {
    procedure(path).mockImplementation((async (input: unknown) =>
      answer(path, input)) as never);
  }
});

const routes = {
  "album/[name]/[token]": () => null,
  "artist/[name]/[token]/[tab]": () => null,
  "show/[name]/[season]/[token]": () => null,
  "song/[name]/[token]": () => null,
  "playlist/[name]/[token]": () => null,
};

/** Renders `ui` and waits for `text`; an error or not-found state fails. */
async function expectShown(ui: ReactElement, text: string) {
  await renderScreen(ui, { routes });
  await waitFor(
    () => expect(screen.getAllByText(text).length).toBeGreaterThan(0),
    { timeout: 10_000 },
  );
  expect(screen.queryByText("Try again")).toBeNull();
  expect(screen.queryByText(/ not found$/)).toBeNull();
}

function searchResults(type: "all" | ListSearchType, query: string) {
  return (
    <SearchResults
      query={query}
      type={type}
      header={<Text>chips</Text>}
      onShowType={jest.fn()}
      onOpenResult={jest.fn()}
      onSearchArtist={jest.fn()}
    />
  );
}

(DIR ? describe : describe.skip)("screens on live payloads", () => {
  it("home", async () => {
    const home = live("home.home");
    await expectShown(<HomeFeed />, decode(home.charts[0].title));
  });

  it("album", async () => {
    const album = live("album.details");
    await expectShown(
      <AlbumScreen token={parseToken(album.perma_url)} />,
      decode(album.list[0].title),
    );
  });

  it("playlist", async () => {
    const playlist = live("playlist.details");
    await expectShown(
      <PlaylistScreen token={parseToken(playlist.perma_url)} />,
      decode(playlist.list[0].title),
    );
  });

  it("song", async () => {
    const song = live("song.details").songs[0];
    await expectShown(
      <SongScreen token={parseToken(song.perma_url)} />,
      decode(song.title),
    );
  });

  it.each([
    ["overview", () => live("artist.details").topSongs[0].title],
    ["songs", () => live("artist.songs").topSongs.songs[0].title],
    ["albums", () => live("artist.albums").topAlbums.albums[0].title],
  ] as const)("artist %s tab", async (tab, title) => {
    const artist = live("artist.details");
    await expectShown(
      <ArtistScreen token={parseToken(artist.urls.songs)} initialTab={tab} />,
      decode(title()),
    );
  });

  it("show", async () => {
    const show = live("show.details");
    await expectShown(
      <ShowScreen token={parseToken(show.show_details.perma_url)} />,
      decode(live("show.episodes")[0].title),
    );
  });

  it("episode", async () => {
    const episode = live("show.episodeDetails").episodes[0];
    await expectShown(
      <EpisodeScreen token={parseToken(episode.perma_url)} />,
      decode(episode.title),
    );
  });

  it("label", async () => {
    if (!existsSync(join(DIR, "get.label.json"))) return;
    await expectShown(
      <LabelScreen token="label" />,
      decode(live("get.label").name),
    );
  });

  it("combined search", async () => {
    const all = live("search.all");
    await expectShown(
      searchResults("all", "arijit"),
      decode(all.albums.data[0].title),
    );
  });

  it.each([
    ["song", "songs", "title"],
    ["album", "albums", "title"],
    ["playlist", "playlists", "title"],
    ["artist", "artists", "name"],
    ["show", "podcasts", "title"],
  ] as const)("%s search", async (type, file, key) => {
    const [first] = live(`search.byType.${file}`).results;
    await expectShown(searchResults(type, "love"), decode(first[key]));
  });

  it.each([
    ["top charts", TopChartsScreen, () => live("get.charts")[0].title],
    ["top albums", TopAlbumsScreen, () => live("get.topAlbums").data[0].title],
    [
      "top artists",
      TopArtistsScreen,
      () => live("get.topArtists").top_artists[0].name,
    ],
    [
      "top podcasts",
      TopPodcastsScreen,
      () => live("get.topShows").data[0].title,
    ],
    [
      "featured playlists",
      FeaturedPlaylistsScreen,
      () => live("get.featuredPlaylists").data[0].title,
    ],
    [
      "featured stations",
      FeaturedStationsScreen,
      () => live("get.featuredStations")[0].title,
    ],
  ] as const)("%s", async (_name, Screen, title) => {
    await expectShown(<Screen />, decode(title()));
  });

  it("station", async () => {
    const [station] = live("get.featuredStations");
    const ref = stationRef(station.perma_url);
    if (!ref) throw new Error("not a station link");
    await expectShown(<StationScreen {...ref} />, decode(station.title));
  });
});
