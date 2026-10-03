import { describe, expect, it } from "bun:test";

const SONG_LIST = new URL(
  "../components/song-list/song-list.tsx",
  import.meta.url,
);

describe("song list titles", () => {
  it("decodes HTML entities in song titles before render", async () => {
    const source = await Bun.file(SONG_LIST).text();

    expect(source).toContain("decode(item.title)");
    expect(source).toMatch(/\{decode\(item\.title\)\}/);
  });
});
