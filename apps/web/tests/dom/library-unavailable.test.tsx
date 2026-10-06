import { describe, expect, it, mock } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

void mock.module("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

const { LibraryUnavailable } =
  await import("../../components/library/library-section");

describe("LibraryUnavailable", () => {
  it("is a polite status, not an assertive alert", () => {
    const html = renderToStaticMarkup(<LibraryUnavailable what="songs" />);

    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Couldn’t load your songs");
  });
});
