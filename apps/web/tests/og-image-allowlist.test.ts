import { describe, expect, it } from "bun:test";

import { IMAGE_CDN_HOSTS, parseAllowedImageUrl } from "../lib/image-hosts";

describe("OG route image allowlist (SSRF)", () => {
  it("accepts https URLs on the image CDN hosts", () => {
    for (const host of IMAGE_CDN_HOSTS) {
      expect(parseAllowedImageUrl(`https://${host}/a/b-500x500.jpg`)).not.toBe(
        null,
      );
    }
  });

  it.each([
    "http://c.saavncdn.com/a.jpg",
    "https://evil.example/a.jpg",
    "https://c.saavncdn.com.evil.example/a.jpg",
    "https://evil.example/@c.saavncdn.com/a.jpg",
    "https://c.saavncdn.com@evil.example/a.jpg",
    "https://user:pw@c.saavncdn.com/a.jpg",
    "https://c.saavncdn.com:8443/a.jpg",
    "http://169.254.169.254/latest/meta-data",
    "http://localhost:3000/api/trpc",
    "file:///etc/passwd",
    "//evil.example/a.jpg",
    "not a url",
    "",
  ])("rejects %p", (raw) => {
    expect(parseAllowedImageUrl(raw)).toBe(null);
  });

  it("derives next.config remotePatterns from the same list", async () => {
    const source = await Bun.file(
      new URL("../next.config.ts", import.meta.url),
    ).text();
    expect(source).toContain("IMAGE_CDN_HOSTS");
  });

  it("validates the og image param before fetching and refuses redirects", async () => {
    const source = await Bun.file(
      new URL("../app/api/og/route.tsx", import.meta.url),
    ).text();
    expect(source).toContain("parseAllowedImageUrl(requestedImage)");
    expect(source).toContain('redirect: "error"');
  });
});

describe("security headers", () => {
  it("next.config sets baseline security headers on every route", async () => {
    const source = await Bun.file(
      new URL("../next.config.ts", import.meta.url),
    ).text();
    for (const key of [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]) {
      expect(source).toContain(key);
    }
    expect(source).toContain('source: "/:path*"');
  });
});
