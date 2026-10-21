import { describe, expect, it } from "bun:test";

import type { ArtistMini } from "../src/artist";
import { rawAlbum } from "../src/fixtures";
import {
  artistCards,
  isExplicit,
  plainText,
  toArtistCard,
  toCardItems,
} from "../src/media";

function artist(overrides: Partial<ArtistMini>): ArtistMini {
  return {
    id: "1",
    name: "Hussam &amp; Co",
    role: "music",
    image: "https://c.saavncdn.com/artists/Hussam_150x150.jpg",
    type: "artist",
    perma_url: "https://www.jiosaavn.com/artist/hussam-songs/AbC_",
    ...overrides,
  };
}

describe("artistCards", () => {
  it("shows an artist once however many roles upstream lists", () => {
    const cards = artistCards([
      artist({ role: "music" }),
      artist({ role: "singer" }),
      artist({ id: "2", name: "Flipperachi", role: "singer" }),
    ]);

    expect(cards.map((card) => card.id)).toEqual(["1", "2"]);
    expect(cards[0]).toMatchObject({
      name: "Hussam & Co",
      type: "artist",
      url: "https://www.jiosaavn.com/artist/hussam-songs/AbC_",
    });
  });
});

describe("toArtistCard", () => {
  it("decodes the name and the optional subtitle", () => {
    expect(
      toArtistCard({
        id: "9",
        name: "A &amp; B",
        perma_url: "https://www.jiosaavn.com/artist/a-b-songs/Xy_",
        image: "",
        subtitle: "Singer &amp; Composer",
      }),
    ).toEqual({
      id: "9",
      name: "A & B",
      url: "https://www.jiosaavn.com/artist/a-b-songs/Xy_",
      subtitle: "Singer & Composer",
      type: "artist",
      image: "",
    });
  });
});

describe("toCardItems", () => {
  it("adapts raw items to cards", () => {
    expect(toCardItems([rawAlbum()])).toMatchObject([
      { name: "Udta Teer", type: "album" },
    ]);
  });
});

describe("plainText", () => {
  it("turns breaks into newlines and drops every tag", () => {
    expect(
      plainText('<p>Intro <b>bold</b><br/>Second <a href="x">line</a></p>'),
    ).toBe("Intro bold\nSecond line");
  });

  it("decodes entities after stripping, so encoded markup stays text", () => {
    expect(plainText("Tom &amp; Jerry &lt;b&gt;live&lt;/b&gt;")).toBe(
      "Tom & Jerry <b>live</b>",
    );
  });

  it("is empty without a description", () => {
    expect(plainText(undefined)).toBe("");
  });
});

describe("isExplicit", () => {
  it('reads upstream\'s "1"/"0" as well as "true" and booleans', () => {
    expect(isExplicit("1")).toBe(true);
    expect(isExplicit("true")).toBe(true);
    expect(isExplicit(true)).toBe(true);
    expect(isExplicit("0")).toBe(false);
    expect(isExplicit("false")).toBe(false);
    expect(isExplicit("")).toBe(false);
    expect(isExplicit(false)).toBe(false);
    expect(isExplicit(undefined)).toBe(false);
  });
});
