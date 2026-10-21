import { describe, expect, it } from "bun:test";

import { rawAlbum, rawLaunchData, rawPlaylist } from "../src/fixtures";
import { homeHighlights, homeItems, homeSections } from "../src/home";

describe("homeItems", () => {
  it("returns null for a section that is not a list", () => {
    expect(homeItems({ title: "Trending" })).toBeNull();
    expect(homeItems("text")).toBeNull();
    expect(homeItems(undefined)).toBeNull();
  });

  it("keeps well-formed items as they are", () => {
    expect(
      homeItems([
        {
          id: "7",
          title: "Album",
          perma_url: "https://www.jiosaavn.com/album/a/7",
          subtitle: "Sub",
          type: "album",
          image: "https://c.saavncdn.com/x-500x500.jpg",
          explicit_content: "true",
        },
      ]),
    ).toEqual([
      {
        id: "7",
        title: "Album",
        perma_url: "https://www.jiosaavn.com/album/a/7",
        subtitle: "Sub",
        type: "album",
        image: "https://c.saavncdn.com/x-500x500.jpg",
        explicit_content: "true",
      },
    ]);
  });

  it("drops entries that are not objects", () => {
    expect(homeItems([null, "x", 3, { id: "1", title: "Ok" }])).toEqual([
      {
        id: "1",
        title: "Ok",
        perma_url: "",
        subtitle: undefined,
        type: undefined,
        image: "",
        explicit_content: undefined,
      },
    ]);
  });

  it("leaves type unset when it is not a known media type", () => {
    const [item] = homeItems([{ id: "1", title: "T", type: "podcast" }]) ?? [];
    expect(item?.type).toBeUndefined();
  });

  it("keeps a boolean explicit flag and ignores other types", () => {
    const [flagged, other] =
      homeItems([
        { id: "1", title: "A", explicit_content: true },
        { id: "2", title: "B", explicit_content: 1 },
      ]) ?? [];
    expect(flagged?.explicit_content).toBe(true);
    expect(other?.explicit_content).toBeUndefined();
  });
});

describe("homeSections", () => {
  it("lists the card sections in order with their titles, skipping configuration", () => {
    const sections = homeSections(rawLaunchData());

    expect(sections.map(({ key, title }) => [key, title])).toEqual([
      ["new_albums", "New Releases"],
      ["charts", "Charts"],
      ["radio", "Radio Stations"],
      ["top_playlists", undefined],
    ]);
  });

  it("types untyped items from their section and keeps each item once", () => {
    const [radio] = homeSections(
      rawLaunchData({
        new_albums: [],
        charts: [],
        top_playlists: [],
        radio: [],
        trending: [
          { id: "1", title: "One", type: "song" },
          { id: "1", title: "One again" },
          { id: "2", title: "Two" },
        ],
      }),
    );

    expect(radio?.items.map(({ id, type }) => [id, type])).toEqual([
      ["1", "song"],
      ["2", "playlist"],
    ]);
  });
});

describe("homeHighlights", () => {
  it("features the first playlist and splits the rest into quick picks and tiles", () => {
    const playlists = Array.from({ length: 7 }, (_, i) =>
      rawPlaylist({ id: `p${i}` }),
    );
    const { featured, quickPicks, heroTiles } = homeHighlights(
      rawLaunchData({
        top_playlists: playlists,
        new_albums: [rawAlbum({ id: "a1" })],
        charts: [],
      }),
    );

    expect(featured?.id).toBe("p0");
    expect(quickPicks.map(({ id }) => id)).toEqual([
      "a1",
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
    expect(heroTiles.map(({ id }) => id)).toEqual(["p5", "p6"]);
  });
});
