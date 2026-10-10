import { describe, expect, it, mock } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

void mock.module("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

const { LibraryEmpty, LibraryUnavailable } =
  await import("../../components/library/library-section");

describe("LibraryUnavailable", () => {
  it("is a polite status, not an assertive alert", () => {
    const html = renderToStaticMarkup(<LibraryUnavailable what="songs" />);

    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Couldn’t load your songs");
  });

  it("keeps retry and empty-state actions at the 44px touch height on mobile", () => {
    const retry = renderToStaticMarkup(<LibraryUnavailable what="songs" />);
    const empty = renderToStaticMarkup(
      <LibraryEmpty
        icon={() => null}
        title="Nothing"
        description="Nothing here"
        action={{ href: "/chart", label: "Browse" }}
      />,
    );

    expect(retry).toContain("h-11");
    expect(empty).toContain("h-11");
  });
});
