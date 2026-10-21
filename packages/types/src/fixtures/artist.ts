import type { Artist, ArtistSong, SimilarArtist } from "../artist";
import type { Label } from "../get";
import { rawAlbum } from "./collections";
import { rawSong } from "./song";

/**
 * Raw `artist.details` and `get.label` payloads shaped like the live ones:
 * `name` and `artistId`/`labelId` (no `title`/`id`), `_150x150` artwork, an
 * artist's JSON-encoded `bio`, and the per-tab `urls`. Overrides are shallow.
 */

export const ARTIST_TOKEN = "LnMfdXjMGl0_";

const similar: SimilarArtist = {
  id: "455190",
  name: "Fadi Aymen &amp; Co",
  roles: "",
  aka: "",
  fb: "",
  twitter: "",
  wiki: "",
  similar: "",
  dob: "",
  image_url: "https://c.saavncdn.com/artists/Fadi_Aymen_500x500.jpg?bch=1",
  search_keywords: "",
  primary_artist_id: "",
  combine_artist_pages: 0,
  replace_with_primary_artists: 0,
  languages: "arabic",
  perma_url: "https://www.jiosaavn.com/artist/fadi-aymen-songs/RbVfsAk3Sd8_",
  type: "artist",
  isRadioPresent: true,
  dominantType: "song",
};

const single: ArtistSong = {
  ...rawSong({ id: "single1", title: "Sahra", type: "song" }),
  more_info: {
    query: "",
    text: "",
    music: "Hussam Assim",
    song_count: "1",
    artistMap: { primary_artists: [], featured_artists: [], artists: [] },
  },
};

export const ARTIST_BIO = JSON.stringify([
  {
    text: "Born in Dubai.\nStarted rapping at 15.",
    sequence: "1",
    title: "Early life",
  },
]);

export function rawArtist(overrides: Partial<Artist> = {}): Artist {
  return {
    artistId: "2393548",
    name: "Flipperachi",
    subtitle: "Singer",
    image:
      "https://c.saavncdn.com/artists/Flipperachi_000_20251212122325_150x150.jpg",
    follower_count: "1200",
    type: "artist",
    isVerified: true,
    dominantLanguage: "arabic",
    dominantType: "song",
    topSongs: [
      rawSong({ id: "BSaNI3Yr" }),
      rawSong({ id: "second01", title: "Second Song" }),
    ],
    topAlbums: [rawAlbum()],
    singles: [single],
    similarArtists: [similar],
    isRadioPresent: true,
    bio: ARTIST_BIO,
    dob: "",
    fb: "",
    twitter: "",
    wiki: "",
    urls: {
      albums: `https://www.jiosaavn.com/artist/flipperachi-albums/${ARTIST_TOKEN}`,
      bio: `/artist/flipperachi-bio/${ARTIST_TOKEN}`,
      comments: `https://www.jiosaavn.com/artist/flipperachi-comments/${ARTIST_TOKEN}`,
      songs: `https://www.jiosaavn.com/artist/flipperachi-songs/${ARTIST_TOKEN}`,
    },
    availableLanguages: ["arabic"],
    fan_count: "48200",
    is_followed: false,
    modules: {
      topSongs: {
        source: "artist",
        position: 1,
        title: "Top Songs",
        subtitle: "",
      },
      topAlbums: {
        source: "artist",
        position: 2,
        title: "Top Albums",
        subtitle: "",
      },
      singles: {
        source: "artist",
        position: 3,
        title: "Singles",
        subtitle: "",
      },
      similarArtists: {
        source: "artist",
        position: 4,
        title: "Similar Artists",
        subtitle: "",
      },
    },
    ...overrides,
  };
}

/** The upstream shape of one `artist.songs` page: the list nested under `topSongs`. */
export function artistSongsPage(ids: string[], lastPage = false) {
  return {
    topSongs: {
      songs: ids.map((id) => rawSong({ id, title: `Song ${id}` })),
      last_page: lastPage,
      total: 99,
    },
  };
}

export function artistAlbumsPage(ids: string[], lastPage = false) {
  return {
    topAlbums: {
      albums: ids.map((id) =>
        rawAlbum({
          id,
          title: `Album ${id}`,
          perma_url: `https://www.jiosaavn.com/album/album-${id}/tok${id}`,
        }),
      ),
      last_page: lastPage,
      total: 99,
    },
  };
}

export const LABEL_TOKEN = "pKJp4RENQb4_";

export function rawLabel(overrides: Partial<Label> = {}): Label {
  const songs = [
    rawSong({ id: "BSaNI3Yr" }),
    rawSong({ id: "second01", title: "Second Song" }),
  ];
  const albums = [rawAlbum()];
  return {
    labelId: "2203994",
    name: "Outlaw Productions &amp; Co",
    image: "https://c.saavncdn.com/labels/Outlaw_Productions_150x150.jpg",
    topSongs: { songs, total: songs.length },
    topAlbums: { albums, total: albums.length },
    urls: {
      albums: `https://www.jiosaavn.com/label/outlaw-productions-albums/${LABEL_TOKEN}`,
      songs: `https://www.jiosaavn.com/label/outlaw-productions-songs/${LABEL_TOKEN}`,
    },
    availableLanguages: ["arabic"],
    ...overrides,
  };
}
