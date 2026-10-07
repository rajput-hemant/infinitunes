import { describe, expect, it } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { ArtistLinks } from "../../components/song-list/artist-links";

const artists = ["A", "B", "C", "D", "E"].map((name) => ({
  id: name,
  name,
  perma_url: `/artist/${name}/${name}`,
}));

describe("ArtistLinks", () => {
  it("shows every credit up to three with no overflow marker", () => {
    const html = renderToStaticMarkup(
      <ArtistLinks artists={artists.slice(0, 3)} />,
    );

    expect(html).toContain(">A, <");
    expect(html).toContain(">C<");
    expect(html).not.toContain("more");
    expect(html).not.toContain("title=");
  });

  it("collapses credits past three into +N more with the full list on hover", () => {
    const html = renderToStaticMarkup(<ArtistLinks artists={artists} />);

    expect(html).toContain("+2 more");
    expect(html).toContain('title="A, B, C, D, E"');
  });

  it("keeps the suffix outside the one-line clamp so long names cannot hide it", () => {
    const html = renderToStaticMarkup(<ArtistLinks artists={artists} />);
    const clamped = /<span class="line-clamp-1[^"]*">.*?<\/span>/.exec(html);

    expect(clamped?.[0]).toContain("A, ");
    expect(clamped?.[0]).not.toContain("more");
    expect(html).toContain("+2 more");
  });

  it("keeps credits past the visible three as links for assistive tech", () => {
    const html = renderToStaticMarkup(<ArtistLinks artists={artists} />);
    const hidden = /<span class="sr-only[^"]*">(.*?)<\/span><\/p>/.exec(
      html,
    )?.[1];

    expect(hidden).toContain('href="/artist/D/D"');
    expect(hidden).toContain('href="/artist/E/E"');
    expect(hidden).not.toContain('href="/artist/C/C"');
  });

  it("reveals the hidden credits while one of them has keyboard focus", () => {
    const html = renderToStaticMarkup(<ArtistLinks artists={artists} />);

    expect(html).toContain("focus-within:not-sr-only");
  });

  it("exposes the single hidden credit when there are four", () => {
    const html = renderToStaticMarkup(
      <ArtistLinks artists={artists.slice(0, 4)} />,
    );

    expect(html).toContain("+1 more");
    expect(html).toContain('href="/artist/D/D"');
  });

  it("decodes an HTML-encoded name once in the link text and the title", () => {
    const html = renderToStaticMarkup(
      <ArtistLinks
        artists={[
          { id: "g", name: "Guns N&#039; Roses", perma_url: "/artist/g/g" },
          ...artists.slice(0, 3),
        ]}
      />,
    );

    expect(html).toContain("Guns N&#x27; Roses");
    expect(html).not.toContain("&amp;#039;");
    expect(html).toContain('title="Guns N&#x27; Roses, A, B, C"');
  });
});
