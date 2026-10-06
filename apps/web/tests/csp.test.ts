import { describe, expect, it } from "bun:test";

import {
  buildCsp,
  CSP_ENFORCE,
  cspHeaderName,
  CSP_ENFORCING_HEADER,
  CSP_REPORT_ONLY_HEADER,
} from "../lib/csp";

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

  it("locks down directives that do not fall back to default-src", () => {
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });

  it("embeds exactly the nonce it is given", () => {
    const a = buildCsp({ nonce: "AAA" });
    const b = buildCsp({ nonce: "BBB" });
    expect(a).toContain("'nonce-AAA'");
    expect(a).not.toContain("BBB");
    expect(b).toContain("'nonce-BBB'");
  });

  it("never allows inline or remote scripts beyond the nonce", () => {
    const scripts = directive(
      buildCsp({ nonce: "n", umami: true }),
      "script-src",
    );
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("*");
  });

  it("adds Umami hosts only when configured", () => {
    const withUmami = buildCsp({ nonce: "n", umami: true });
    expect(directive(withUmami, "script-src")).toContain("https://us.umami.is");
    expect(withUmami).toContain("https://api-gateway.umami.dev");
    expect(csp).not.toContain("umami");
  });
});

describe("cspHeaderName", () => {
  it("picks the enforcing header only when asked", () => {
    expect(cspHeaderName(true)).toBe(CSP_ENFORCING_HEADER);
    expect(cspHeaderName(false)).toBe(CSP_REPORT_ONLY_HEADER);
  });

  it("follows CSP_ENFORCE by default", () => {
    expect(cspHeaderName()).toBe(
      CSP_ENFORCE ? CSP_ENFORCING_HEADER : CSP_REPORT_ONLY_HEADER,
    );
  });
});
