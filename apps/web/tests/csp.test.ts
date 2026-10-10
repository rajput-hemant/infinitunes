import { describe, expect, it } from "bun:test";

import {
  buildCsp,
  scriptHash,
  CSP_ENFORCE,
  cspHeaderName,
  CSP_ENFORCING_HEADER,
  CSP_REPORT_ONLY_HEADER,
} from "../lib/csp";
import { THEME_BOOTSTRAP_SCRIPT } from "../lib/theme-script";

describe("buildCsp", () => {
  const csp = buildCsp();
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

  it("allows scripts by hash without nonces, unsafe-eval or analytics by default", () => {
    expect(directive(csp, "script-src")).toEqual([
      "'self'",
      scriptHash(THEME_BOOTSTRAP_SCRIPT),
    ]);
    expect(csp).not.toContain("nonce");
  });

  it("hashes the exact theme bootstrap script text", () => {
    const digest = new Bun.CryptoHasher("sha256")
      .update(THEME_BOOTSTRAP_SCRIPT)
      .digest("base64");
    expect(directive(csp, "script-src")).toContain(`'sha256-${digest}'`);
  });

  it("allows unsafe-eval only in dev", () => {
    expect(buildCsp({ isDev: true })).toContain("'unsafe-eval'");
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

  it("never allows inline or remote scripts beyond the hashes", () => {
    const scripts = directive(buildCsp({ umami: true }), "script-src");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("*");
  });

  it("adds Umami hosts only when configured", () => {
    const withUmami = buildCsp({ umami: true });
    expect(directive(withUmami, "script-src")).toContain("https://us.umami.is");
    expect(withUmami).toContain("https://gateway.umami.is");
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
