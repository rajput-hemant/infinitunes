import type { ArtistMini } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";

import { artistCards, cardItemsOf } from "./cards";

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

describe("cardItemsOf", () => {
  it("adapts raw items to cards", () => {
    expect(cardItemsOf([rawAlbum()])).toMatchObject([
      { name: "Udta Teer", type: "album" },
    ]);
  });
});
