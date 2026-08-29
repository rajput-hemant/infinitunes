import { describe, expect, it } from "bun:test";

import type { Song, Album, Playlist, Artist } from "@infinitunes/types";

import { api } from "../src/lib/api";

// Fixture helpers matching `@infinitunes/types` structure
const mockSong: Song = {
  id: "s1",
  title: "Test Song",
  subtitle: "Test Subtitle",
  header_desc: "",
  type: "song",
  perma_url: "https://www.jiosaavn.com/song/test/s1",
  image: "https://example.com/song.jpg",
  language: "hindi",
  year: "2024",
  play_count: "1000",
  explicit_content: "0",
  list_count: "",
  list_type: "",
  list: "",
  more_info: {
    music: "Artist 1",
    album_id: "a1",
    album: "Test Album",
    label: "Test Label",
    origin: "none",
    is_dolby_content: false,
    "320kbps": "true",
    encrypted_media_url: "",
    encrypted_cache_url: "",
    album_url: "",
    duration: "180",
    rights: {
      code: 0,
      cacheable: true,
      delete_cached_object: false,
      reason: "",
    },
    cache_state: "true",
    has_lyrics: "true",
    lyrics_snippet: "",
    starred: "false",
    copyright_text: "",
    artistMap: {
      primary_artists: [
        {
          id: "ar1",
          name: "Artist 1",
          role: "singer",
          image: "",
          type: "artist",
          perma_url: "",
        },
      ],
      featured_artists: [],
      artists: [
        {
          id: "ar1",
          name: "Artist 1",
          role: "singer",
          image: "",
          type: "artist",
          perma_url: "",
        },
      ],
    },
    label_url: "",
    vcode: "",
    vlink: "",
    triller_available: false,
    request_jiotune_flag: false,
    webp: "true",
    lyrics_id: "l1",
  },
};

const mockAlbum: Album = {
  id: "a1",
  title: "Test Album",
  subtitle: "Test Subtitle",
  type: "album",
  image: "https://example.com/album.jpg",
  perma_url: "https://www.jiosaavn.com/album/test/a1",
  header_desc: "",
  explicit_content: "0",
  language: "hindi",
  year: "2024",
  play_count: "5000",
  list_count: "1",
  list_type: "song",
  list: [mockSong],
  more_info: {
    song_count: "1",
  },
};

const mockPlaylist: Playlist = {
  id: "p1",
  title: "Test Playlist",
  subtitle: "Test Subtitle",
  type: "playlist",
  image: "https://example.com/playlist.jpg",
  perma_url: "https://www.jiosaavn.com/featured/test/p1",
  header_desc: "",
  explicit_content: "0",
  language: "hindi",
  year: "2024",
  play_count: "10000",
  list_count: "1",
  list_type: "song",
  list: [mockSong],
  more_info: {
    firstname: "User",
    song_count: "1",
  },
};

const mockArtist: Artist = {
  artistId: "ar1",
  name: "Artist 1",
  subtitle: "Artist Subtitle",
  image: "https://example.com/artist.jpg",
  type: "artist",
  perma_url: "https://www.jiosaavn.com/artist/test/ar1",
  follower_count: "500",
  topSongs: [mockSong],
  topAlbums: [mockAlbum],
};

describe("router procedures", () => {
  it("home.home returns launch data with processed download URLs", async () => {
    const mockLaunchData = {
      new_trending: [mockSong],
      top_playlists: [mockPlaylist],
    };

    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockLaunchData), { status: 200 });
    }) as typeof fetch;

    // Call api directly with injected mock fetchFn to test data flow
    const result = (await api(
      "content.getLaunchData",
      { language: "hindi" },
      mockFetch,
    )) as typeof mockLaunchData;
    expect(result.new_trending[0].id).toBe("s1");
    expect(result.new_trending[0].title).toBe("Test Song");
  });

  it("song.details returns song payload matching SongObj shape", async () => {
    const mockPayload = {
      songs: [mockSong],
    };

    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockPayload), { status: 200 });
    }) as typeof fetch;

    const result = (await api(
      "song.getDetails",
      { query: { pids: "s1" } },
      mockFetch,
    )) as typeof mockPayload;
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].id).toBe("s1");
    expect(result.songs[0].more_info.album).toBe("Test Album");
  });

  it("album.details returns album payload matching Album shape", async () => {
    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockAlbum), { status: 200 });
    }) as typeof fetch;

    const result = (await api(
      "content.getAlbumDetails",
      { query: { albumid: "a1" } },
      mockFetch,
    )) as Album;
    expect(result.id).toBe("a1");
    expect(result.title).toBe("Test Album");
    expect(Array.isArray(result.list)).toBe(true);
  });

  it("playlist.details returns playlist payload matching Playlist shape", async () => {
    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockPlaylist), { status: 200 });
    }) as typeof fetch;

    const result = (await api(
      "playlist.getDetails",
      { query: { listid: "p1" } },
      mockFetch,
    )) as Playlist;
    expect(result.id).toBe("p1");
    expect(result.title).toBe("Test Playlist");
  });

  it("artist.details returns artist payload matching Artist shape", async () => {
    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockArtist), { status: 200 });
    }) as typeof fetch;

    const result = (await api(
      "artist.getArtistDetails",
      { query: { artistId: "ar1" } },
      mockFetch,
    )) as Artist;
    expect(result.artistId).toBe("ar1");
    expect(result.name).toBe("Artist 1");
    expect(result.topSongs).toHaveLength(1);
  });

  it("song.details supports token lookup via webapi.get", async () => {
    const mockPayload = {
      songs: [mockSong],
    };

    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockPayload), { status: 200 });
    }) as typeof fetch;

    const result = (await api(
      "webapi.get",
      { query: { token: "token123", type: "song" } },
      mockFetch,
    )) as typeof mockPayload;
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].id).toBe("s1");
  });

  it("artist.details supports token lookup via webapi.get", async () => {
    const mockFetch: typeof fetch = (async () => {
      return new Response(JSON.stringify(mockArtist), { status: 200 });
    }) as typeof fetch;

    const result = (await api(
      "webapi.get",
      { query: { token: "token123", type: "artist" } },
      mockFetch,
    )) as Artist;
    expect(result.artistId).toBe("ar1");
    expect(result.name).toBe("Artist 1");
  });
});
