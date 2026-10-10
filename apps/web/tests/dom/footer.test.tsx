import { describe, expect, it } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { SiteFooter } from "../../components/site-footer/footer";

describe("SiteFooter", () => {
  it("is a single row of legal links with the theme segment", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    for (const label of ["Privacy", "Terms", "GitHub"]) {
      expect(html).toContain(`>${label}</a>`);
    }
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('aria-label="Toggle Dark Mode"');
    expect(html).not.toContain("Top Artist");
  });
});
