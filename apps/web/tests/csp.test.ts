import { describe, expect, it } from "bun:test";

import { buildCsp } from "../lib/csp";

describe("buildCsp", () => {
  const csp = buildCsp({ nonce: "abc123" });
  const directive = (value: string, name: string) =>
    value
      .split("; ")
      .find((d) => d.startsWith(`${name} `))
      ?.split(" ")
      .slice(1) ?? [];

  it("locks defaults down and forbids framing", () => {
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
  });

  it("nonces scripts without unsafe-eval or analytics by default", () => {
    expect(directive(csp, "script-src")).toEqual(["'self'", "'nonce-abc123'"]);
  });

  it("allows unsafe-eval only in dev", () => {
    expect(buildCsp({ nonce: "n", isDev: true })).toContain("'unsafe-eval'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("allows the image and audio CDNs", () => {
    expect(directive(csp, "img-src")).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://c.saavncdn.com",
      "https://c.sop.saavncdn.com",
    ]);
    expect(directive(csp, "media-src")).toEqual([
      "'self'",
      "blob:",
      "https://aac.saavncdn.com",
    ]);
  });

  it("adds Umami hosts only when configured", () => {
    const withUmami = buildCsp({ nonce: "n", umami: true });
    expect(directive(withUmami, "script-src")).toContain("https://us.umami.is");
    expect(withUmami).toContain("https://api-gateway.umami.dev");
    expect(csp).not.toContain("umami");
  });
});

describe("root layout analytics script", () => {
  it("carries the per-request nonce from the x-nonce header", async () => {
    const source = await Bun.file(
      new URL("../app/layout.tsx", import.meta.url),
    ).text();
    expect(source).toContain('.get("x-nonce")');
    expect(source).toMatch(/<Script[^>]*nonce=\{nonce\}/s);
  });
});
