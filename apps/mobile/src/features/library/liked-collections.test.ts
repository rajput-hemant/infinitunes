import { toArtistCard } from "./liked-collections";

describe("toArtistCard", () => {
  it("opens the artist's songs page under the decoded name", () => {
    expect(
      toArtistCard({
        artistId: "2393548",
        name: "Simon &amp; Garfunkel",
        subtitle: "Folk &amp; rock",
        image: "https://c.saavncdn.com/artists/x_150x150.jpg",
        urls: {
          albums: "https://www.jiosaavn.com/artist/sg-albums/abc_",
          bio: "https://www.jiosaavn.com/artist/sg-biography/abc_",
          comments: "https://www.jiosaavn.com/artist/sg-comments/abc_",
          songs: "https://www.jiosaavn.com/artist/sg-songs/abc_",
        },
      }),
    ).toEqual({
      id: "2393548",
      name: "Simon & Garfunkel",
      url: "https://www.jiosaavn.com/artist/sg-songs/abc_",
      subtitle: "Folk & rock",
      type: "artist",
      image: "https://c.saavncdn.com/artists/x_150x150.jpg",
    });
  });
});
