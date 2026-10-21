import type { Album } from "../album";
import type { ArtistMini } from "../artist";
import type { Chart, Mix } from "../get";
import type { Playlist } from "../playlist";
import { rawSong } from "./song";

/** Raw albums, playlists, charts and mixes as their detail and list procedures return them. */

export function rawAlbum(overrides: Partial<Album> = {}): Album {
  return {
    id: "82064668",
    title: "Udta Teer",
    subtitle: "Sachin-Jigar, Amitabh Bhattacharya",
    header_desc: "",
    type: "album",
    perma_url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
    image:
      "https://c.saavncdn.com/845/Udta-Teer-Hindi-2026-20261015175017-150x150.jpg",
    language: "hindi",
    year: "2026",
    play_count: "",
    explicit_content: "0",
    list_count: "0",
    list_type: "song",
    list: "",
    more_info: {
      song_count: "4",
      artistMap: { primary_artists: [], featured_artists: [], artists: [] },
    },
    ...overrides,
  };
}

const curator: ArtistMini = {
  id: "7",
  name: "Arijit &amp; Co",
  role: "",
  image: "https://c.saavncdn.com/artists/Arijit_150x150.jpg",
  type: "artist",
  perma_url: "https://www.jiosaavn.com/artist/arijit-songs/QwErTy_",
};

/** A `playlist.details` payload with two songs; list endpoints send the same shape. */
export function rawPlaylist(overrides: Partial<Playlist> = {}): Playlist {
  const id = overrides.id ?? "1134543272";
  return {
    id,
    title: "Hits &amp; Misses",
    subtitle: "Editors Picks",
    type: "playlist",
    perma_url: `https://www.jiosaavn.com/featured/hits/${id}`,
    image: "https://c.saavncdn.com/playlists/hits-150x150.jpg",
    language: "hindi",
    explicit_content: "0",
    list_type: "song",
    list: [
      rawSong({ id: "song-1", title: "Opener" }),
      rawSong({ id: "song-2", title: "Closer" }),
    ],
    more_info: {
      uid: "u1",
      is_dolby_content: false,
      username: "jiosaavn",
      firstname: "JioSaavn",
      lastname: "",
      playlist_type: "default",
      artists: [curator],
      subtitle_desc: ["50 Songs", "Hindi"],
    },
    ...overrides,
  };
}

export function rawChart(overrides: Partial<Chart> = {}): Chart {
  const id = overrides.id ?? "chart-1";
  return {
    id,
    title: "Top 15 Hindi &amp; Punjabi",
    subtitle: "JioSaavn",
    type: "playlist",
    image: "https://c.saavncdn.com/charts/top15-150x150.jpg",
    perma_url: `https://www.jiosaavn.com/featured/top-15-hindi/${id}`,
    explicit_content: "0",
    ...overrides,
  };
}

/** A `get.mix` payload: a playlist-like list with the songs inline. */
export function rawMix(overrides: Partial<Mix> = {}): Mix {
  return {
    id: "mix-1",
    title: "Chill &amp; Focus",
    subtitle: "",
    header_desc: "",
    type: "mix",
    perma_url: "https://www.jiosaavn.com/featured/chill/XyZ_",
    image: "https://c.saavncdn.com/mixes/chill-150x150.jpg",
    language: "hindi",
    year: "2026",
    play_count: "",
    explicit_content: "0",
    list_count: "2",
    list_type: "song",
    list: [
      rawSong({ id: "song-1", title: "Calm One" }),
      rawSong({ id: "song-2", title: "Calm Two" }),
    ],
    more_info: {
      uid: "u1",
      last_updated: "",
      username: "jiosaavn",
      firstname: "Made for",
      lastname: "You",
      is_followed: "false",
      playlist_type: "mix",
      share: "0",
    },
    modules: {
      list: {
        source: "",
        position: 1,
        score: "",
        bucket: "",
        scroll_type: "",
        title: "",
        subtitle: "",
        highlight: "",
        simpleHeader: false,
        noHeader: false,
        view_more: [],
      },
    },
    ...overrides,
  };
}
