import { describe, expect, it } from "bun:test";

import { Radio } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  LibraryEmpty,
  LibraryHeading,
} from "../../components/library/library-section";

describe("LibraryHeading", () => {
  it("renders an h2 by default", () => {
    expect(renderToStaticMarkup(<LibraryHeading title="Settings" />)).toMatch(
      /<h2 [^>]*>Settings<\/h2>/,
    );
  });

  it("keeps a page title an h1 and accepts rich content", () => {
    const html = renderToStaticMarkup(
      <LibraryHeading
        as="h1"
        title={<em>shakira</em>}
        description="3 Results"
      />,
    );

    expect(html).toMatch(/<h1 [^>]*><em>shakira<\/em><\/h1>/);
    expect(html).not.toContain("<h2");
    expect(html).toContain("3 Results");
  });

  it("renders an empty-state title as an h3 unless told otherwise", () => {
    const props = {
      icon: Radio,
      title: "Nothing here",
      description: "Try later",
    };

    expect(renderToStaticMarkup(<LibraryEmpty {...props} />)).toMatch(
      /<h3 [^>]*>Nothing here<\/h3>/,
    );

    const html = renderToStaticMarkup(<LibraryEmpty {...props} titleAs="p" />);
    expect(html).not.toMatch(/<h[1-6]/);
    expect(html).toContain("Nothing here");
  });
});
