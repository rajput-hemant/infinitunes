import { rawArtist, ARTIST_TOKEN } from "@infinitunes/types/fixtures";

import { artistShareUrl } from "./artist-share-url";

describe("artistShareUrl", () => {
  it("points at the Overview, not the Songs tab the URL names", () => {
    expect(artistShareUrl(rawArtist())).toBe(
      `https://www.jiosaavn.com/artist/flipperachi/${ARTIST_TOKEN}`,
    );
  });

  it("keeps a name that merely contains the suffix", () => {
    const artist = rawArtist({
      urls: {
        ...rawArtist().urls,
        songs: `https://www.jiosaavn.com/artist/hit-songs-ahmed/${ARTIST_TOKEN}`,
      },
    });
    expect(artistShareUrl(artist)).toBe(
      `https://www.jiosaavn.com/artist/hit-songs-ahmed/${ARTIST_TOKEN}`,
    );
  });
});
