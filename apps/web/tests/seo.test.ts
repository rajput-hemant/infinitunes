import { describe, expect, test } from "bun:test";

import { metadata as meLayoutMetadata } from "~/app/(root)/me/layout";
import robots from "~/app/robots";
import sitemap from "~/app/sitemap";
import { siteConfig } from "~/config/site";
import { siteUrl } from "~/lib/site-url";

const origin = new URL(siteConfig.url).origin;

describe("siteUrl", () => {
  test("joins the site origin and a path", () => {
    expect(siteUrl("/album/a/b")).toBe(`${origin}/album/a/b`);
  });

  test("defaults to the site root with a single slash", () => {
    expect(siteUrl()).toBe(`${origin}/`);
  });

  test("keeps an already encoded path segment as it is", () => {
    expect(siteUrl("/search/all/love%2525")).toBe(
      `${origin}/search/all/love%2525`,
    );
  });
});

describe("robots", () => {
  const { rules, sitemap: sitemapUrl } = robots();
  const groups = [rules].flat();
  test("blocks AI crawlers outright and leaves everyone else crawlable", () => {
    const agents = groups
      .filter((group) => group.disallow === "/")
      .flatMap((group) => [group.userAgent ?? []].flat());

    expect(agents).toEqual(
      expect.arrayContaining(["GPTBot", "ClaudeBot", "CCBot"]),
    );
    expect(agents).not.toContain("Googlebot");
    expect(agents).not.toContain("facebookexternalhit");
    expect(agents).not.toContain("Applebot");
  });

  test("closes only the API to the general group and points at the sitemap", () => {
    expect(groups).toContainEqual({
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    });
    expect(sitemapUrl).toBe(`${origin}/sitemap.xml`);
  });

  test("does not disallow noindex routes, so crawlers can read the noindex tag", () => {
    const disallowed = groups.flatMap((group) => group.disallow ?? []);

    for (const path of ["/me", "/settings", "/login", "/signup"]) {
      expect(disallowed).not.toContain(path);
    }
  });
});

describe("noindex routes", () => {
  test("every /me page inherits noindex from the /me layout", () => {
    expect(meLayoutMetadata.robots).toEqual({ index: false });
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const paths = entries.map((entry) => new URL(entry.url).pathname);

  test("lists the home page and the catalog listing pages", () => {
    expect(paths).toEqual(
      expect.arrayContaining(["/", "/album", "/artist", "/playlist", "/show"]),
    );
  });

  test("uses absolute URLs on the site origin, without duplicates", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(`${origin}/`)).toBe(true);
    }
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(
      entries.length,
    );
  });

  test("omits user pages, settings, sign-in, search and API routes", () => {
    for (const path of paths) {
      expect(path === "/me" || path.startsWith("/me/")).toBe(false);
      expect(path.startsWith("/settings")).toBe(false);
      expect(path.startsWith("/search")).toBe(false);
      expect(path.startsWith("/api")).toBe(false);
      expect([
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ]).not.toContain(path);
    }
  });

  test("omits the placeholder legal pages", () => {
    expect(paths).not.toContain("/privacy");
    expect(paths).not.toContain("/terms");
  });

  test("never lists entity pages, so the catalog is not walked", () => {
    for (const path of paths) {
      expect(path.split("/").filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });
});
