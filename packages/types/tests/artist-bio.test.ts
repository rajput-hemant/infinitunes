import { describe, expect, it } from "bun:test";

import { parseArtistBio, repairMojibake } from "../src/artist-bio";

/** Upstream encodes each section as `{ text, sequence, title }` inside a JSON string. */
const encode = (sections: unknown[]) => JSON.stringify(sections);

describe("parseArtistBio", () => {
  it("reads the upstream JSON array and returns titled sections in sequence order", () => {
    const raw = encode([
      { text: "Second body.", sequence: 2, title: "Early Life" },
      { text: "First body.", sequence: 1, title: "Introduction" },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      { title: "Introduction", paragraphs: ["First body."] },
      { title: "Early Life", paragraphs: ["Second body."] },
    ]);
  });

  it("sorts numeric sequences and puts sections without one last", () => {
    const raw = encode([
      { text: "C", title: "No sequence" },
      { text: "B", sequence: 10, title: "Ten" },
      { text: "A", sequence: 2, title: "Two" },
    ]);

    expect(parseArtistBio(raw).map((s) => s.title)).toEqual([
      "Two",
      "Ten",
      "No sequence",
    ]);
  });

  it("repairs UTF-8 bytes that were read as Windows-1252 and Latin-1", () => {
    const raw = encode([
      {
        // "Himesh's" with a curly apostrophe, and "Expos\u00e9" with an acute accent.
        text: "Himesh\u00e2\u20ac\u2122s desire. The Expos\u00c3\u00a9 hit.",
        sequence: 1,
        title: "Intro\u00e2\u20ac\u2122s",
      },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      {
        title: "Intro\u2019s",
        paragraphs: ["Himesh\u2019s desire. The Expos\u00e9 hit."],
      },
    ]);
  });

  it("splits on \\r\\n and blank lines into paragraphs", () => {
    const raw = encode([
      {
        text: "One.\r\nTwo.\r\n\r\nThree.",
        sequence: 1,
        title: "Lines",
      },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      { title: "Lines", paragraphs: ["One.", "Two.", "Three."] },
    ]);
  });

  it("turns lines starting with a bullet into a list, after the paragraphs", () => {
    const bullet = "\u00e2\u20ac\u00a2";
    const raw = encode([
      {
        text: `Lead line.\r\n${bullet} Composed title songs\r\n${bullet} Judged the finale`,
        sequence: 1,
        title: "TV Serials",
      },
      {
        text: `${bullet} Filmfare Award\r\n${bullet} Zee Cine Award`,
        sequence: 2,
        title: "Awards",
      },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      {
        title: "TV Serials",
        paragraphs: ["Lead line."],
        bullets: ["Composed title songs", "Judged the finale"],
      },
      {
        title: "Awards",
        paragraphs: [],
        bullets: ["Filmfare Award", "Zee Cine Award"],
      },
    ]);
  });

  it("omits the bullets key when a section has none", () => {
    const [section] = parseArtistBio(
      encode([{ text: "Only prose.", sequence: 1, title: "Prose" }]),
    );

    expect(section).toEqual({ title: "Prose", paragraphs: ["Only prose."] });
    expect(section).not.toHaveProperty("bullets");
  });

  it("decodes HTML entities in text and titles", () => {
    const raw = encode([
      { text: "Tom &amp; Jerry &#8217;s", sequence: 1, title: "R&amp;B" },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      { title: "R&B", paragraphs: ["Tom & Jerry \u2019s"] },
    ]);
  });

  it("drops sections whose text is empty or whitespace", () => {
    const raw = encode([
      { text: "  \r\n ", sequence: 1, title: "Blank" },
      { text: "Kept.", sequence: 2, title: "Kept" },
      { sequence: 3, title: "Missing text" },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      { title: "Kept", paragraphs: ["Kept."] },
    ]);
  });

  it("keeps valid accented and non-Latin text unchanged", () => {
    const raw = encode([
      { text: "Caf\u00e9 \u65e5\u672c", sequence: 1, title: "Caf\u00e9" },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      { title: "Caf\u00e9", paragraphs: ["Caf\u00e9 \u65e5\u672c"] },
    ]);
  });

  it("treats non-JSON text as plain paragraphs with no title", () => {
    expect(parseArtistBio("A short bio.\r\nWith a second line.")).toEqual([
      { title: "", paragraphs: ["A short bio.", "With a second line."] },
    ]);
  });

  it("falls back to plain text when the JSON is invalid", () => {
    const raw = '[{"text": "unterminated';

    expect(parseArtistBio(raw)).toEqual([
      { title: "", paragraphs: ['[{"text": "unterminated'] },
    ]);
  });

  it("reads a JSON string value as plain text", () => {
    expect(parseArtistBio(JSON.stringify("Quoted bio."))).toEqual([
      { title: "", paragraphs: ["Quoted bio."] },
    ]);
  });

  it("returns no sections for empty input", () => {
    expect(parseArtistBio("")).toEqual([]);
    expect(parseArtistBio("   ")).toEqual([]);
    expect(parseArtistBio(null)).toEqual([]);
    expect(parseArtistBio(undefined)).toEqual([]);
    expect(parseArtistBio("[]")).toEqual([]);
  });
});

describe("repairMojibake", () => {
  it("maps Windows-1252 specials back to their bytes before decoding", () => {
    expect(repairMojibake("\u00e2\u20ac\u201c")).toBe("\u2013");
    expect(repairMojibake("\u00e2\u20ac\u201d")).toBe("\u2014");
    expect(repairMojibake("\u00e2\u20ac\u00a2")).toBe("\u2022");
  });

  it("leaves a run unchanged when its bytes are not valid UTF-8", () => {
    expect(repairMojibake("\u00e9")).toBe("\u00e9");
    expect(repairMojibake("caf\u00e9\u2019s")).toBe("caf\u00e9\u2019s");
  });
});

describe("parseArtistBio on an upstream payload", () => {
  it("repairs a mojibake bullet list with an en dash and keeps section order", () => {
    const bullet = "â€¢";
    const raw = encode([
      {
        text: `${bullet} Teri Meri - Bodyguard (2011)\r\n${bullet} Hookah Bar â€“ Khiladi 786 (2012)`,
        sequence: 6,
        title: "Top 10 Hit Songs",
      },
      { text: "Introduction body.", sequence: 1, title: "Introduction" },
    ]);

    expect(parseArtistBio(raw)).toEqual([
      { title: "Introduction", paragraphs: ["Introduction body."] },
      {
        title: "Top 10 Hit Songs",
        paragraphs: [],
        bullets: [
          "Teri Meri - Bodyguard (2011)",
          "Hookah Bar – Khiladi 786 (2012)",
        ],
      },
    ]);
  });
});
