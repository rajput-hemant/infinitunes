import { describe, expect, it } from "bun:test";

import { createClientEnv } from "../src/client";
import { clientSchema } from "../src/schema";

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
