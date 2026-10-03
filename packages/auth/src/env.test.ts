import { describe, expect, it } from "bun:test";

import { authSchema } from "./env";

describe("authSchema AUTH_URL on Vercel", () => {
  const parse = (ctx: Parameters<typeof authSchema>[0], url?: string) =>
    authSchema(ctx).AUTH_URL.parse(url);

  it("prefixes https:// onto the scheme-less VERCEL_URL host", () => {
    expect(
      parse({ vercel: true, vercelUrl: "infinitunes-abc.vercel.app" }),
    ).toBe("https://infinitunes-abc.vercel.app");
  });

  it("leaves an already-qualified VERCEL_URL untouched", () => {
    expect(
      parse({ vercel: true, vercelUrl: "https://infinitunes.example.com" }),
    ).toBe("https://infinitunes.example.com");
  });

  it("uses the configured AUTH_URL when not on Vercel", () => {
    expect(parse({}, "http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("prefers an explicit AUTH_URL over both Vercel hosts", () => {
    expect(
      parse(
        {
          vercel: true,
          vercelUrl: "preview.vercel.app",
          vercelProductionUrl: "infinitunes.example.com",
        },
        "https://auth.example.com",
      ),
    ).toBe("https://auth.example.com");
  });

  it("falls back to the production domain before the deployment host", () => {
    expect(
      parse({
        vercel: true,
        vercelUrl: "preview.vercel.app",
        vercelProductionUrl: "infinitunes.example.com",
      }),
    ).toBe("https://infinitunes.example.com");
  });

  it("uses VERCEL_URL on previews with no production domain", () => {
    expect(parse({ vercel: true, vercelUrl: "preview.vercel.app" })).toBe(
      "https://preview.vercel.app",
    );
  });

  it("adds https:// to a scheme-less explicit AUTH_URL", () => {
    expect(parse({ vercel: true }, "music.example.com")).toBe(
      "https://music.example.com",
    );
  });
});
