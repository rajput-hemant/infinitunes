import { describe, expect, it, mock } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { controlStyles } from "../../lib/control-styles";

void mock.module("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

const { LibraryEmpty, LibraryUnavailable } =
  await import("../../components/library/library-section");

describe("LibraryUnavailable", () => {
  it("is a polite status, not an assertive alert", () => {
    const html = renderToStaticMarkup(<LibraryUnavailable what="songs" />);

    expect(html).toMatch(/^<output/);
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Couldn’t load your songs");
  });

  it("sizes retry and empty-state actions from the shared text control", () => {
    const retry = renderToStaticMarkup(<LibraryUnavailable what="songs" />);
    const empty = renderToStaticMarkup(
      <LibraryEmpty
        icon={() => null}
        title="Nothing"
        description="Nothing here"
        action={{ href: "/chart", label: "Browse" }}
      />,
    );

    for (const token of controlStyles.text.split(" ")) {
      expect(retry).toContain(token);
      expect(empty).toContain(token);
    }
  });
});
