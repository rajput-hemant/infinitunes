import { describe, expect, it } from "bun:test";

import { toQueue } from "../src/media";
import { toQueueEntry, toSongRow } from "../src/row";
import type { Episode } from "../src/show";
import type { Song } from "../src/song";

const artist = (id: string, role: string) => ({
  id,
  name: `Artist &amp; ${id}`,
  role,
  image: "https://c.saavncdn.com/artists/a-150x150.jpg",
  type: "artist" as const,
  perma_url: `https://www.jiosaavn.com/artist/${id}/tok${id}`,
});

const song = {
  id: "s1",
  title: "Rock &amp; Roll",
  subtitle: "Album &quot;X&quot;",
  header_desc: "",
  type: "song",
  perma_url: "https://www.jiosaavn.com/song/rock-roll/AbCd",
  image: "http://c.saavncdn.com/001/x-150x150.jpg",
  language: "hindi",
  year: "2020",
  play_count: "10",
  explicit_content: "1",
  list_count: "",
  list_type: "",
  list: "",
  download_url: "https://cdn/a_12.mp4,https://cdn/a_48.mp4",
  more_info: {
    album: "Black &amp; White",
    album_url: "https://www.jiosaavn.com/album/bw/1234",
    duration: "180",
    "320kbps": "false",
    lyrics_snippet: "x".repeat(500),
    copyright_text: "y".repeat(500),
    artistMap: {
      primary_artists: [artist("a1", "singer")],
      featured_artists: [],
      artists: [
        artist("a1", "singer"),
        artist("a1", "music"),
        artist("a2", ""),
      ],
    },
  },
} as unknown as Song;

describe("toSongRow", () => {
  const row = toSongRow(song);

  it("decodes texts and keeps what rows and menus read", () => {
    expect(row.name).toBe("Rock & Roll");
    expect(row.subtitle).toBe('Album "X"');
    expect(row.album).toBe("Black & White");
    expect(row.albumUrl).toBe("https://www.jiosaavn.com/album/bw/1234");
    expect(row.url).toBe(song.perma_url);
    expect(row.duration).toBe(180);
    expect(row.language).toBe("hindi");
    expect(row.image).toBe("https://c.saavncdn.com/001/x-150x150.jpg");
  });

  it("keeps the download links and the 320kbps cap for playback fallback", () => {
    expect(row.download_url).toBe(song.download_url ?? "");
    expect(row.maxQuality).toBe("high");
    expect(
      toSongRow({
        ...song,
        more_info: { ...song.more_info, "320kbps": "true" },
      }).maxQuality,
    ).toBeUndefined();
  });

  it("reduces artists to credits and de-duplicates the queue list", () => {
    expect(row.primaryArtists).toEqual([
      {
        id: "a1",
        name: "Artist &amp; a1",
        perma_url: "https://www.jiosaavn.com/artist/a1/toka1",
      },
    ]);
    expect(row.artists.map((a) => a.id)).toEqual(["a1", "a2"]);
    expect(Object.keys(row.artists[0] ?? {}).sort()).toEqual([
      "id",
      "name",
      "perma_url",
    ]);
  });

  it("drops the raw upstream bulk", () => {
    const raw = JSON.stringify(song).length;
    const slim = JSON.stringify(row).length;
    expect(slim).toBeLessThan(raw / 2);
    expect(JSON.stringify(row)).not.toContain("lyrics_snippet");
  });

  it("queues the same entry the raw song would", () => {
    const { queueItemId: a, ...fromRaw } = toQueue(song);
    const { queueItemId: b, ...fromRow } = toQueueEntry(row);
    expect(a).not.toBe(b);
    expect(fromRow).toEqual(fromRaw);
  });

  it("maps an episode with its release date and no album", () => {
    const episode = {
      ...song,
      type: "episode",
      more_info: {
        release_date: "2024-01-02",
        duration: "60",
        artistMap: { primary_artists: [], featured_artists: [], artists: [] },
      },
    } as unknown as Episode;
    const mapped = toSongRow(episode);
    expect(mapped.type).toBe("episode");
    expect(mapped.releaseDate).toBe("2024-01-02");
    expect(mapped.album).toBeUndefined();
    expect(mapped.albumUrl).toBeUndefined();
  });
});

describe("toSongRow identity", () => {
  it("returns the same row for the same raw song and shares credit objects", () => {
    const a = toSongRow(song);
    expect(toSongRow(song)).toBe(a);
    expect(a.primaryArtists[0]).toBe(a.artists[0]);
  });
});
