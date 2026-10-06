import { describe, expect, it } from "bun:test";

import { getClientKey, resolveTrustedProxy } from "~/lib/client-ip";

const h = (init: Record<string, string>) => new Headers(init);

describe("getClientKey", () => {
  it("ignores forgeable headers when no proxy is trusted", () => {
    expect(
      getClientKey(
        h({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }),
        "false",
      ),
    ).toBe("untrusted");
  });

  it("vercel: x-real-ip first, then the first forwarded entry, trimmed", () => {
    expect(
      getClientKey(
        h({ "x-real-ip": " 203.0.113.7 ", "x-forwarded-for": "9.9.9.9" }),
        "vercel",
      ),
    ).toBe("203.0.113.7");
    expect(
      getClientKey(
        h({ "x-forwarded-for": " 198.51.100.9 , 10.0.0.1" }),
        "vercel",
      ),
    ).toBe("198.51.100.9");
  });

  it("true: uses the last forwarded entry so a forged prefix cannot rotate the key", () => {
    expect(
      getClientKey(h({ "x-forwarded-for": "6.6.6.6, 198.51.100.9" }), "true"),
    ).toBe("198.51.100.9");
  });

  it("true: ignores a client-supplied x-real-ip that conflicts with the forwarded entry", () => {
    expect(
      getClientKey(
        h({ "x-real-ip": "6.6.6.6", "x-forwarded-for": "198.51.100.9" }),
        "true",
      ),
    ).toBe("198.51.100.9");
    expect(getClientKey(h({ "x-real-ip": "6.6.6.6" }), "true")).toBe(
      "untrusted",
    );
  });

  it("vercel: conflicting headers resolve to x-real-ip, not the forwarded list", () => {
    expect(
      getClientKey(
        h({
          "x-real-ip": "203.0.113.7",
          "x-forwarded-for": "6.6.6.6, 9.9.9.9",
        }),
        "vercel",
      ),
    ).toBe("203.0.113.7");
  });

  it("falls back to the shared key when a trusted proxy sent nothing", () => {
    expect(getClientKey(h({}), "vercel")).toBe("untrusted");
    expect(getClientKey(h({}), "true")).toBe("untrusted");
  });
});

describe("resolveTrustedProxy", () => {
  it("prefers the explicit setting, else detects Vercel, else distrusts", () => {
    expect(resolveTrustedProxy("false", "1")).toBe("false");
    expect(resolveTrustedProxy("true", undefined)).toBe("true");
    expect(resolveTrustedProxy(undefined, "1")).toBe("vercel");
    expect(resolveTrustedProxy(undefined, undefined)).toBe("false");
  });
});
