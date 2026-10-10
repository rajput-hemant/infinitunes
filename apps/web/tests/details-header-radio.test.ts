import { describe, expect, it } from "bun:test";

const DETAILS_HEADER = new URL(
  "../components/details-header/details-header.tsx",
  import.meta.url,
);

const MORE_BUTTON = new URL(
  "../components/details-header/more-button.tsx",
  import.meta.url,
);

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

  it("more-button accepts artistId and passes it to radio.createStation", async () => {
    const source = await Bun.file(MORE_BUTTON).text();

    expect(source).toContain("artistId?: string;");
    expect(source).toContain("artistId: initialArtistId,");
    expect(source).toContain(
      "let artistId: string | undefined = initialArtistId;",
    );
    expect(source).toContain("artistId,");
    expect(source).toContain("language: stationLanguage,");
  });
});
