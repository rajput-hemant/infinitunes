import { describe, expect, it } from "bun:test";

const { homeItems } = await import("../../app/(root)/_components/home-items");

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
