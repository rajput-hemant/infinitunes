import {
  rawChart,
  rawPlaylist,
  rawStation,
  rawLaunchData,
  rawAlbum,
} from "@infinitunes/types/fixtures";

import { buildHomeModel, isHomeEmpty } from "./home-model";

describe("buildHomeModel", () => {
  it("features the first playlist and quick-picks albums and the next playlists", () => {
    const model = buildHomeModel(rawLaunchData());

    expect(model.carousel.map((item) => item.name)).toEqual([
      "Featured Mix",
      "Top 15 Hindi & Punjabi",
    ]);
    expect(model.quickPicks.map((item) => item.name)).toEqual([
      "Udta Teer",
      "Second Playlist",
    ]);
  });

  it("makes a titled shelf of every card section, in upstream order", () => {
    const modules = rawLaunchData({
      promo: [
        {
          id: "promo-1",
          title: "Tamil &amp; Telugu",
          perma_url: "https://www.jiosaavn.com/featured/tamil/promo-1",
          image: "https://c.saavncdn.com/promo-150x150.jpg",
        },
      ],
      untitled: [rawAlbum()],
    });
    modules.modules.promo = {
      source: "promo",
      position: 4,
      title: "Promos &amp; Picks",
      subtitle: "",
    };

    const shelves = buildHomeModel(modules).shelves;

    expect(shelves.map((shelf) => shelf.title)).toEqual([
      "New Releases",
      "Charts",
      "Radio Stations",
      "Promos & Picks",
    ]);
    expect(shelves[3]?.items[0]).toMatchObject({
      name: "Tamil & Telugu",
      type: "playlist",
    });
    expect(shelves[0]?.seeAllHref).toBe("/album");
    expect(shelves[3]?.seeAllHref).toBeUndefined();
  });

  it("drops entries that cannot be shown and repeats of one item", () => {
    const station = rawStation();
    const modules = rawLaunchData({
      radio: [station, station, rawStation({ id: "other", title: "" })],
    });

    const radio = buildHomeModel(modules).shelves.find(
      (shelf) => shelf.key === "radio",
    );

    expect(radio?.items).toHaveLength(1);
  });

  it("is empty only when nothing can be shown", () => {
    const empty = rawLaunchData({
      new_albums: [],
      charts: [],
      radio: [],
      top_playlists: [],
    });

    expect(isHomeEmpty(buildHomeModel(empty))).toBe(true);
    expect(isHomeEmpty(buildHomeModel(rawLaunchData()))).toBe(false);
  });

  it("keeps six quick picks, to fill four rows after Surprise Me and Browse", () => {
    const model = buildHomeModel(
      rawLaunchData({
        new_albums: Array.from({ length: 4 }, (_, i) =>
          rawAlbum({ id: `a${i}`, title: `Album ${i}` }),
        ),
        top_playlists: Array.from({ length: 6 }, (_, i) =>
          rawPlaylist({ id: `p${i}`, title: `Playlist ${i}` }),
        ),
      }),
    );

    expect(model.quickPicks.map((item) => item.name)).toEqual([
      "Album 0",
      "Album 1",
      "Album 2",
      "Album 3",
      "Playlist 1",
      "Playlist 2",
    ]);
  });

  it("follows the featured playlist with charts, then the playlists after the quick picks", () => {
    const playlists = Array.from({ length: 8 }, (_, i) =>
      rawPlaylist({ id: `p${i}`, title: `Playlist ${i}` }),
    );
    const model = buildHomeModel(
      rawLaunchData({
        top_playlists: playlists,
        charts: [rawChart({ id: "c1", title: "Chart" })],
      }),
    );

    expect(model.carousel.map((tile) => tile.name)).toEqual([
      "Playlist 0",
      "Chart",
      "Playlist 5",
      "Playlist 6",
      "Playlist 7",
    ]);
    expect(model.carousel.map((tile) => model.eyebrows[tile.id])).toEqual([
      "Featured playlist",
      "Chart",
      "Playlist",
      "Playlist",
      "Playlist",
    ]);
  });
});
