import { describe, expect, it } from "bun:test";

import { parseArtistBio } from "@infinitunes/types";
import { renderToStaticMarkup } from "react-dom/server";

import { ArtistBio } from "../app/(root)/artist/[name]/[token]/_components/artist-bio";

const bullet = "â€¢";

const raw = JSON.stringify([
  {
    text: `${bullet} Composed title songs\r\n${bullet} Judged <b>the</b> finale`,
    sequence: 2,
    title: "TV Serials",
  },
  {
    text: "Himeshâ€™s father was a composer.\r\n\r\nHe began young.",
    sequence: 1,
    title: "Early Life",
  },
]);

describe("ArtistBio", () => {
  it("renders one h3 per section in sequence order with readable paragraphs", () => {
    const html = renderToStaticMarkup(
      <ArtistBio sections={parseArtistBio(raw)} />,
    );

    expect(html.indexOf("Early Life")).toBeLessThan(html.indexOf("TV Serials"));
    expect(html).toContain("<h3");
    expect(html).toContain("Himesh’s father was a composer.");
    expect(html).toContain("He began young.");
  });

  it("renders bullets as list items without the bullet glyph", () => {
    const html = renderToStaticMarkup(
      <ArtistBio sections={parseArtistBio(raw)} />,
    );

    expect(html).toContain("<ul");
    expect(html).toContain("<li>Composed title songs</li>");
    expect(html).not.toContain("•");
  });

  it("escapes markup in bio text as plain text", () => {
    const html = renderToStaticMarkup(
      <ArtistBio sections={parseArtistBio(raw)} />,
    );

    expect(html).toContain("Judged &lt;b&gt;the&lt;/b&gt; finale");
    expect(html).not.toContain("<b>the</b>");
  });

  it("omits the heading when a section has no title", () => {
    const html = renderToStaticMarkup(
      <ArtistBio sections={parseArtistBio("Just a plain bio.")} />,
    );

    expect(html).not.toContain("<h3");
    expect(html).toContain("Just a plain bio.");
  });
});
