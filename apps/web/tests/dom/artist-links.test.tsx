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
    expect(html).not.toContain(">D<");
  });
});
