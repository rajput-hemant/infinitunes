import type {
  Album,
  Artist,
  ArtistMap,
  Label,
  Rights,
  Song,
} from "@infinitunes/types";

const rights: Rights = {
  code: 0,
  cacheable: 0,
  delete_cached_object: 0,
  reason: "",
};

const artistMap: ArtistMap = {
  primary_artists: [
    {
      id: "a1",
      image: "",
      perma_url: "https://www.example.test/artist/a1",
      type: "artist",
      name: "Tum &amp; Me",
      role: "",
    },
  ],
};

export function songFixture(overrides: Partial<Song> = {}): Song {
  return {
    id: "s1",
    title: "Song",
    subtitle: "",
    header_desc: "",
    type: "song",
    perma_url: "https://www.example.test/song/s1",
    image: "",
    language: "hindi",
    year: "2020",
    play_count: "10",
    explicit_content: "0",
    list_count: "0",
    list_type: "",
    list: "",
    more_info: {
      music: "",
      album_id: "",
      album: "Album",
      label: "",
      origin: "",
      is_dolby_content: false,
      "320kbps": "",
      encrypted_media_url: "",
      encrypted_cache_url: "",
      album_url: "",
      duration: "200",
      rights,
      cache_state: "",
      has_lyrics: "",
      lyrics_snippet: "",
      starred: "",
      copyright_text: "",
      artistMap,
      label_url: "",
      vcode: "",
      vlink: "",
      triller_available: false,
      request_jiotune_flag: false,
      webp: "",
      lyrics_id: "",
    },
    ...overrides,
  };
}

export function albumFixture(overrides: Partial<Album> = {}): Album {
  return {
    id: "al1",
    title: "Album",
    subtitle: "",
    type: "album",
    image: "",
    perma_url: "",
    header_desc: "",
    explicit_content: "0",
    language: "hindi",
    year: "2020",
    play_count: "",
    list_count: "",
    list_type: "song",
    more_info: {},
    ...overrides,
  };
}

const artistFields: Artist = {
  artistId: "a1",
  name: "Tum &amp; Me",
  subtitle: "",
  image: "",
  follower_count: "0",
  type: "artist",
  isVerified: true,
  dominantLanguage: "hindi",
  dominantType: "song",
  similarArtists: [],
  isRadioPresent: false,
  bio: "",
  dob: "",
  fb: "",
  twitter: "",
  wiki: "",
  urls: { albums: "", bio: "", comments: "", songs: "" },
  availableLanguages: [],
  fan_count: "0",
  is_followed: false,
  modules: {},
};

export function artistFixture(): Artist {
  return artistFields;
}

export const labelFixture: Label = {
  labelId: "l1",
  name: "Label",
  image: "",
  topSongs: { songs: [], total: 0 },
  topAlbums: { albums: [], total: 0 },
  urls: { albums: "", songs: "" },
  availableLanguages: [],
};
