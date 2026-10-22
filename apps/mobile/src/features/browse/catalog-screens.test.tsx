import type { TopShow } from "@infinitunes/types";
import { rawPlaylist } from "@infinitunes/types/fixtures";
import { screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";

import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { FeaturedPlaylistsScreen } from "./featured-playlists-screen";
import { TopArtistsScreen } from "./top-artists-screen";
import { TopPodcastsScreen } from "./top-podcasts-screen";

const show: TopShow = {
  id: "show-1",
  title: "The &amp; Podcast",
  subtitle: "Hosted by Ada",
  type: "show",
  image: "https://c.saavncdn.com/shows/podcast-150x150.jpg",
  perma_url: "https://www.jiosaavn.com/shows/the-podcast/show-1",
  explicit_content: "0",
  more_info: {
    season_number: "1",
    release_date: "2026-01-01",
    year: "2026",
    badge: "",
    square_image: "",
  },
};

/** The `GridCell` around a card: the nearest view with a start or end inset. */
function cellStyle(title: string) {
  let node = screen.getByText(title).parent;
  while (node) {
    const style = StyleSheet.flatten(node.props.style);
    if (style?.paddingStart !== undefined || style?.paddingEnd !== undefined) {
      return style;
    }
    node = node.parent;
  }
  return undefined;
}

describe("FeaturedPlaylistsScreen", () => {
  it("lists the playlists of the language in the URL", async () => {
    procedure("get.featuredPlaylists").mockResolvedValue({
      count: 1,
      last_page: true,
      data: [rawPlaylist()],
    });
    await renderScreen(<FeaturedPlaylistsScreen />, {
      initialUrl: "/?lang=punjabi",
    });

    expect(await screen.findByText("Hits & Misses")).toBeOnTheScreen();
    expect(procedure("get.featuredPlaylists")).toHaveBeenCalledWith({
      page: 1,
      n: 50,
      lang: "punjabi",
    });
  });

  it("lays a tablet's catalog out in six columns", async () => {
    const phone = Dimensions.get("window");
    Dimensions.set({ window: { ...phone, width: 1024 } });
    try {
      procedure("get.featuredPlaylists").mockResolvedValue({
        count: 6,
        last_page: true,
        data: Array.from({ length: 6 }, (_, index) =>
          rawPlaylist({ id: `p-${index}`, title: `Playlist ${index}` }),
        ),
      });
      await renderScreen(<FeaturedPlaylistsScreen />);
      await screen.findByText("Playlist 5");

      // The sixth card's cell sits on the end gutter; at four columns the fourth would.
      expect(cellStyle("Playlist 0")).toMatchObject({ paddingStart: 16 });
      expect(cellStyle("Playlist 3")).not.toHaveProperty("paddingEnd");
      expect(cellStyle("Playlist 5")).toMatchObject({ paddingEnd: 16 });
    } finally {
      Dimensions.set({ window: phone });
    }
  });

  it("says so when there are no playlists", async () => {
    procedure("get.featuredPlaylists").mockResolvedValue({
      count: 0,
      last_page: true,
      data: [],
    });
    await renderScreen(<FeaturedPlaylistsScreen />);

    expect(await screen.findByText("No playlists yet")).toBeOnTheScreen();
  });
});

describe("TopPodcastsScreen", () => {
  it("holds the header's place with a shelf and section skeleton while loading", async () => {
    procedure("get.topShows").mockReturnValue(new Promise(() => {}));
    await renderScreen(<TopPodcastsScreen />);

    // The grid's own skeleton plus the header's shelf and section header.
    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(1);
    expect(screen.queryByRole("header", { name: "All Podcasts" })).toBeNull();
  });

  it("puts the trending shelf above every show", async () => {
    procedure("get.topShows").mockResolvedValue({
      count: 1,
      last_page: true,
      data: [show],
      trendingPodcasts: [
        {
          items: [{ ...show, id: "trend-1", title: "Trending Show" }],
          module: { source: "x", title: "Trending This Week", subtitle: "" },
        },
      ],
    });
    await renderScreen(<TopPodcastsScreen />);

    expect(
      await screen.findByRole("header", { name: "Trending This Week" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Trending Show")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "All Podcasts" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("The & Podcast")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    procedure("get.topShows").mockRejectedValue(new Error("upstream down"));
    await renderScreen(<TopPodcastsScreen />);

    expect(await screen.findByText("Try again")).toBeOnTheScreen();
  });
});

describe("TopArtistsScreen", () => {
  it("lists artists with their follower counts", async () => {
    procedure("get.topArtists").mockResolvedValue({
      top_artists: [
        {
          artistid: "459320",
          name: "Arijit Singh",
          image: "https://c.saavncdn.com/artists/arijit_150x150.jpg",
          follower_count: 12_500_000,
          is_followed: false,
          perma_url:
            "https://www.jiosaavn.com/artist/arijit-singh-songs/LlRWpHzy3Hk_",
        },
      ],
    });
    await renderScreen(<TopArtistsScreen />);

    expect(await screen.findByText("Arijit Singh")).toBeOnTheScreen();
    expect(screen.getByText("12.5M Fans")).toBeOnTheScreen();
  });

  it("says so when there are no artists", async () => {
    procedure("get.topArtists").mockResolvedValue({ top_artists: [] });
    await renderScreen(<TopArtistsScreen />);

    expect(await screen.findByText("No artists yet")).toBeOnTheScreen();
  });
});
