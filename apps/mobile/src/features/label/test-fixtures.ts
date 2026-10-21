import type { Label } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";

export const LABEL_TOKEN = "pKJp4RENQb4_";

/**
 * A raw `get.label` payload as upstream sends it: `labelId` and `name` (no
 * `id`/`type`), `topSongs.songs` and `topAlbums.albums`, and one `urls`
 * entry per tab. Overrides are shallow.
 */
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
      albums: `/label/outlaw-productions-albums/${LABEL_TOKEN}`,
      songs: `/label/outlaw-productions-songs/${LABEL_TOKEN}`,
    },
    availableLanguages: ["arabic"],
    ...overrides,
  };
}
