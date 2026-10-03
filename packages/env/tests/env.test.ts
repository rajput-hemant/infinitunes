import { describe, expect, it } from "bun:test";

import { createClientEnv } from "../src/client";
import { clientSchema, createServerSchema } from "../src/schema";

describe("clientSchema and NEXT_PUBLIC_APP_URL", () => {
  it("defaults NEXT_PUBLIC_APP_URL to https://infinitunes.rajputhemant.me when unset", () => {
    const env = createClientEnv({
      runtimeEnv: {},
    });
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://infinitunes.rajputhemant.me");
  });

  it("accepts a custom valid NEXT_PUBLIC_APP_URL", () => {
    const env = createClientEnv({
      runtimeEnv: {
        NEXT_PUBLIC_APP_URL: "https://custom.example.com",
      },
    });
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://custom.example.com");
  });

  it("throws validation error when NEXT_PUBLIC_APP_URL is not a valid URL", () => {
    expect(() =>
      createClientEnv({
        runtimeEnv: {
          NEXT_PUBLIC_APP_URL: "not-a-valid-url",
        },
      }),
    ).toThrow("Invalid environment variables");
  });

  it("treats empty string as undefined and falls back to default", () => {
    const env = createClientEnv({
      runtimeEnv: {
        NEXT_PUBLIC_APP_URL: "",
      },
    });
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://infinitunes.rajputhemant.me");
  });

  it("validates direct clientSchema parsing", () => {
    expect(clientSchema.NEXT_PUBLIC_APP_URL.parse(undefined)).toBe(
      "https://infinitunes.rajputhemant.me",
    );
    expect(
      clientSchema.NEXT_PUBLIC_APP_URL.parse("https://music.example.com"),
    ).toBe("https://music.example.com");
    expect(() =>
      clientSchema.NEXT_PUBLIC_APP_URL.parse("invalid-url"),
    ).toThrow();
  });
});

describe("serverSchema AUTH_URL on Vercel", () => {
  const parse = (ctx: Parameters<typeof createServerSchema>[0], url?: string) =>
    createServerSchema(ctx).AUTH_URL.parse(url);

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
