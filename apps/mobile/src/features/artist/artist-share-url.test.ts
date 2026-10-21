import { artistShareUrl } from "./artist-share-url";
import { ARTIST_TOKEN, rawArtist } from "./test-fixtures";

describe("artistShareUrl", () => {
  it("points at the Overview, not the Songs tab the URL names", () => {
    expect(artistShareUrl(rawArtist())).toBe(
      `/artist/flipperachi/${ARTIST_TOKEN}`,
    );
  });

  it("keeps a name that merely contains the suffix", () => {
    const artist = rawArtist({
      urls: {
        ...rawArtist().urls,
        songs: `/artist/hit-songs-ahmed/${ARTIST_TOKEN}`,
      },
    });
    expect(artistShareUrl(artist)).toBe(
      `/artist/hit-songs-ahmed/${ARTIST_TOKEN}`,
    );
  });
});
