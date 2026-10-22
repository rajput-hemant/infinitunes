import { describe, expect, it } from "bun:test";

import type { SongRowItem } from "@infinitunes/types";

import { headerRadioSeed } from "../components/details-header/radio-seed";

const DETAILS_HEADER = new URL(
  "../components/details-header/details-header.tsx",
  import.meta.url,
);

const song = (overrides: Partial<SongRowItem> = {}) =>
  ({
    language: "hindi",
    primaryArtists: [{ id: "a1", name: "Arijit", perma_url: "" }],
    ...overrides,
  }) as SongRowItem;

describe("ISSUE-022: artist details-header Play Radio regression", () => {
  it("details-header passes artistId and language to MoreButton for artist items", async () => {
    const source = await Bun.file(DETAILS_HEADER).text();

    expect(source).toContain("artistId={");
    expect(source).toContain(
      'isKind(item, "artist") ? item.artistId : undefined',
    );
    expect(source).toContain("language={");
    expect(source).toContain("? item.dominantLanguage");
    expect(source).toContain("songs[0]?.language");
  });

  it("an artist header seeds its own station with the artist id and language", () => {
    expect(
      headerRadioSeed({
        type: "artist",
        name: "Arijit Singh",
        artistId: "a1",
        songs: [song()],
        language: "punjabi",
      }),
    ).toEqual({
      type: "artist",
      name: "Arijit Singh",
      artistId: "a1",
      language: "punjabi",
    });
  });

  it("a collection header seeds the first song's lead artist, falling back to the first song's language", () => {
    expect(
      headerRadioSeed({
        type: "album",
        name: "Aashiqui 2",
        songs: [song()],
      }),
    ).toEqual({
      type: "artist",
      name: "Arijit",
      artistId: "a1",
      language: "hindi",
    });
  });

  it("a header with no credits seeds a featured station named after it", () => {
    expect(
      headerRadioSeed({
        type: "playlist",
        name: "Mix",
        songs: [song({ primaryArtists: [] })],
      }),
    ).toEqual({
      type: "featured",
      name: "Mix",
      artistId: undefined,
      language: "hindi",
    });
  });
});
