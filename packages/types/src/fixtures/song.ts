import type { ArtistMini } from "../artist";
import type { Lyrics } from "../get";
import type { Song } from "../song";

/**
 * Raw upstream songs for tests, copied from live `webapi.getLaunchData`
 * payloads: HTML-encoded titles, `-150x150` artwork tokens, the nested
 * `more_info`, and a `download_url` as `withDownloadUrl` attaches it (one
 * link per bitrate, in `QUALITIES_MAP` order). Overrides are shallow.
 */

const singer: ArtistMini = {
  id: "2393548",
  name: "Flipperachi",
  role: "singer",
  image:
    "https://c.saavncdn.com/artists/Flipperachi_000_20251212122325_150x150.jpg",
  type: "artist",
  perma_url: "https://www.jiosaavn.com/artist/flipperachi-songs/LnMfdXjMGl0_",
};

const composer: ArtistMini = {
  id: "6093994",
  name: "Hussam Assim",
  role: "music",
  image: "",
  type: "artist",
  perma_url: "https://www.jiosaavn.com/artist/hussam-assim-songs/1HH1FjrP8sc_",
};

/** The decrypted bitrate ladder for a media path, as `createDownloadLinks` builds it. */
export function downloadLadder(path: string): string {
  return [12, 48, 96, 160, 320]
    .map((rate) => `https://aac.saavncdn.com/${path}_${rate}.mp4`)
    .join(",");
}

export function rawSong(overrides: Partial<Song> = {}): Song {
  const id = overrides.id ?? "BSaNI3Yr";
  return {
    id,
    title: "FA9LA &amp; Friends",
    subtitle: "Flipperachi - FA9LA",
    header_desc: "",
    type: "song",
    perma_url: `https://www.jiosaavn.com/song/fa9la/${id}-token`,
    image:
      "https://c.saavncdn.com/598/OR_198588182598-Arabic-2024-20240524121505-150x150.jpg?bch=497926",
    language: "arabic",
    year: "2024",
    play_count: "8262418",
    explicit_content: "0",
    list_count: "0",
    list_type: "",
    list: "",
    more_info: {
      music: "Hussam Assim",
      album_id: "54611264",
      album: "FA9LA",
      label: "Outlaw Productions",
      origin: "none",
      is_dolby_content: false,
      "320kbps": "true",
      encrypted_media_url:
        "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyCT9PVzZhp8wX5LfB8n7R",
      encrypted_cache_url: "",
      album_url: "https://www.jiosaavn.com/album/fa9la/m3VglOSA0eo_",
      duration: "105",
      rights: {
        code: "0",
        cacheable: "true",
        delete_cached_object: "false",
        reason: "",
      },
      cache_state: "false",
      has_lyrics: "false",
      lyrics_snippet: "",
      starred: "false",
      copyright_text: "(P) 2024 Outlaw Productions",
      artistMap: {
        primary_artists: [singer],
        featured_artists: [],
        artists: [composer, singer],
      },
      release_date: "2024-05-30",
      label_url: "/label/outlaw-productions-albums/pKJp4RENQb4_",
      vcode: "",
      vlink: "",
      triller_available: false,
      request_jiotune_flag: false,
      webp: "true",
      lyrics_id: "",
    },
    download_url: downloadLadder(`598/${id}`),
    ...overrides,
  };
}

/** A `get.lyrics` payload: `<br>`-separated, entity-encoded lines and an HTML copyright. */
export function rawLyrics(overrides: Partial<Lyrics> = {}): Lyrics {
  return {
    lyrics: "First line<br>Second &amp; third<br/><b>bold</b>",
    script_tracking_url: "",
    lyrics_copyright: "Lyrics powered by <a href='x'>Musixmatch</a>",
    snippet: "First line Second",
    ...overrides,
  };
}
