import type { PodcastSearch } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";

import { toResultCard } from "./result-cards";
import type { CardEntry } from "./result-cards";

const artist: Extract<CardEntry, { type: "artist" }> = {
  id: "2393548",
  name: "Flipperachi &amp; Co",
  ctr: 0,
  entity: 1,
  image: "https://c.saavncdn.com/artists/Flipperachi_000_150x150.jpg",
  role: "Artist",
  perma_url: "https://www.jiosaavn.com/artist/flipperachi-songs/LnMfdXjMGl0_",
  type: "artist",
  isRadioPresent: true,
  is_followed: false,
};

const podcast: PodcastSearch["results"][number] = {
  id: "9001",
  title: "Talk &amp; Tunes",
  subtitle: "",
  type: "show",
  image_file_url: "https://c.saavncdn.com/shows/talk-500x500.jpg",
  square_image_url: "",
  partner_name: "",
  label_name: "",
  explicit_content: 0,
  song_info: "",
  latest_season_sequence: 1,
  artists: [],
  featured_artists: [],
  primary_artists: [],
  perma_url: "https://www.jiosaavn.com/shows/talk-tunes/abc_",
};

describe("toResultCard", () => {
  it("names an artist by `name` and describes it by `role`", () => {
    expect(toResultCard(artist)).toMatchObject({
      name: "Flipperachi & Co",
      subtitle: "Artist",
      url: artist.perma_url,
      type: "artist",
    });
  });

  it("takes a podcast's artwork from `image_file_url`", () => {
    expect(toResultCard(podcast)).toMatchObject({
      name: "Talk & Tunes",
      subtitle: undefined,
      image: podcast.image_file_url,
      type: "show",
    });
  });

  it("decodes an album like any catalog card", () => {
    const album = rawAlbum({ title: "Rock &amp; Roll" });

    expect(toResultCard(album)).toMatchObject({
      name: "Rock & Roll",
      type: "album",
      url: album.perma_url,
    });
  });
});
