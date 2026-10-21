import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";

import { orderSongs } from "./song-order";

const row = (id: string, title: string, artist: string) =>
  toSongRow(
    rawSong({
      id,
      title,
      subtitle: `${artist} - ${title}`,
      more_info: {
        ...rawSong().more_info,
        artistMap: {
          primary_artists: [
            {
              id: `artist-${artist}`,
              name: artist,
              role: "singer",
              image: "",
              type: "artist",
              perma_url: `https://www.jiosaavn.com/artist/${artist}/x`,
            },
          ],
          featured_artists: [],
          artists: [],
        },
      },
    }),
  );

const songs = [
  row("1", "Zebra", "Beyoncé"),
  row("2", "Apple", "Zayn"),
  row("3", "Mango", "Adele"),
];

const names = (list: { name: string }[]) => list.map(({ name }) => name);

describe("orderSongs", () => {
  it("keeps the list's own order by default", () => {
    expect(names(orderSongs(songs, "", "recent"))).toEqual([
      "Zebra",
      "Apple",
      "Mango",
    ]);
  });

  it("sorts by title and by first artist", () => {
    expect(names(orderSongs(songs, "", "title"))).toEqual([
      "Apple",
      "Mango",
      "Zebra",
    ]);
    expect(names(orderSongs(songs, "", "artist"))).toEqual([
      "Mango",
      "Zebra",
      "Apple",
    ]);
  });

  it("filters by title or artist, ignoring case and accents", () => {
    expect(names(orderSongs(songs, "  BEYONCE ", "recent"))).toEqual(["Zebra"]);
    expect(names(orderSongs(songs, "mang", "recent"))).toEqual(["Mango"]);
    expect(orderSongs(songs, "nothing like it", "recent")).toEqual([]);
  });

  it("does not reorder the list it was given", () => {
    orderSongs(songs, "", "title");

    expect(names(songs)).toEqual(["Zebra", "Apple", "Mango"]);
  });
});
