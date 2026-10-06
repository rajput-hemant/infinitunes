// Shapes mirror live `artist.songs`/`artist.albums` responses for artist 459320
// (evidence: PQ-1 batch4); no network needed.
import {
  ARTIST_LAST_INITIAL_PAGE,
  nextArtistPage,
  toArtistPage,
} from "~/lib/artist-pagination";

describe("artist pagination (live-shaped fixtures)", () => {
  it("first fetched page follows the 50 items the artist page already holds", () => {
    // n_song/n_album = 50 -> upstream pages 0-4 are already shown.
    expect(nextArtistPage({ last_page: false }, ARTIST_LAST_INITIAL_PAGE)).toBe(
      5,
    );
  });

  it("advances one page at a time and stops on last_page", () => {
    expect(nextArtistPage({ last_page: false }, 5)).toBe(6);
    expect(nextArtistPage({ last_page: true }, 6)).toBeNull();
  });

  it("reads songs/albums nested under topSongs/topAlbums", () => {
    const songs = toArtistPage<{ id: string }>(
      {
        artistId: "1",
        topSongs: { songs: [{ id: "s1" }], total: 9, last_page: false },
      },
      "topSongs",
      "songs",
    );
    expect(songs).toEqual({ items: [{ id: "s1" }], last_page: false });
    const albums = toArtistPage<{ id: string }>(
      { topAlbums: { albums: [{ id: "a1" }], total: 9, last_page: false } },
      "topAlbums",
      "albums",
    );
    expect(albums.items).toEqual([{ id: "a1" }]);
  });

  it("treats an empty page as the end even though upstream keeps last_page false", () => {
    const page = toArtistPage(
      { topSongs: { songs: [], total: 5199, last_page: false } },
      "topSongs",
      "songs",
    );
    expect(page.last_page).toBe(true);
    expect(nextArtistPage(page, 9)).toBeNull();
  });

  it("does not throw on a missing section", () => {
    expect(toArtistPage(null, "topSongs", "songs")).toEqual({
      items: [],
      last_page: true,
    });
  });
});
