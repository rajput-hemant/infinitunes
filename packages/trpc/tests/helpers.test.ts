import { describe, expect, it } from "bun:test";

import { api, validLangs } from "../src/lib/api";
import { createDownloadLinks } from "../src/lib/download";
import { withDownloadUrl } from "../src/router/utils";

describe("validLangs", () => {
  it("returns empty string when input is undefined or empty", () => {
    expect(validLangs(undefined)).toBe("");
    expect(validLangs("")).toBe("");
  });

  it("filters out invalid languages and trims whitespace", () => {
    expect(validLangs("hindi, english, invalid_lang, punjabi")).toBe(
      "hindi,english,punjabi",
    );
  });

  it("returns all valid languages unchanged if all valid", () => {
    expect(validLangs("tamil,telugu")).toBe("tamil,telugu");
  });
});

describe("createDownloadLinks", () => {
  it("returns empty string for missing input or empty DES key", () => {
    expect(createDownloadLinks(undefined)).toBe("");
    expect(createDownloadLinks("")).toBe("");
  });

  it("handles malformed base64 input safely without throwing", () => {
    expect(createDownloadLinks("invalid_base64_string!!!")).toBe("");
  });
});

describe("withDownloadUrl", () => {
  it("does nothing if more_info or encrypted_media_url is missing", () => {
    const item1 = { id: "123", title: "Song 1" };
    expect(withDownloadUrl(item1)).toEqual({ id: "123", title: "Song 1" });

    const item2 = { id: "123", more_info: { album: "Test Album" } };
    expect(withDownloadUrl(item2)).toEqual({
      id: "123",
      more_info: { album: "Test Album" },
    });
  });

  it("safely handles item with invalid encrypted_media_url when DES key is missing", () => {
    const item = {
      id: "123",
      more_info: {
        encrypted_media_url: "some_encrypted_hash",
      },
    };
    // Should not crash and should leave item unmodified when decryption returns empty string
    const result = withDownloadUrl(item);
    expect(result).toEqual({
      id: "123",
      more_info: {
        encrypted_media_url: "some_encrypted_hash",
      },
    });
  });
});

describe("api helper", () => {
  it("uses injected fetchFn and constructs url with default params", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};

    const mockFetch: typeof fetch = (async (url, init) => {
      capturedUrl = url.toString();
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }) as typeof fetch;

    const res = await api<{ status: string }>(
      "content.getLaunchData",
      {},
      mockFetch,
    );

    expect(res).toEqual({ status: "ok" });
    expect(capturedUrl).toContain("https://www.jiosaavn.com/api.php");
    expect(capturedUrl).toContain("__call=content.getLaunchData");
    expect(capturedUrl).toContain("api_version=4");
    expect(capturedHeaders.cookie).toContain("L=hindi,english");
  });

  it("passes custom query parameters and custom language", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};

    const mockFetch: typeof fetch = (async (url, init) => {
      capturedUrl = url.toString();
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await api(
      "song.getDetails",
      {
        isVersion4: false,
        query: { pids: "12345" },
        language: "punjabi, invalid",
      },
      mockFetch,
    );

    expect(capturedUrl).toContain("pids=12345");
    expect(capturedUrl).not.toContain("api_version=4");
    expect(capturedHeaders.cookie).toContain("L=punjabi");
  });

  it("throws TRPCError BAD_GATEWAY when fetchFn returns non-200", async () => {
    const mockFetch: typeof fetch = (async () => {
      return new Response("Server Error", { status: 500 });
    }) as typeof fetch;

    expect(api("test.call", {}, mockFetch)).rejects.toThrow(
      "Upstream returned 500",
    );
  });

  it("throws TRPCError BAD_GATEWAY on invalid JSON response", async () => {
    const mockFetch: typeof fetch = (async () => {
      return new Response("NOT JSON", { status: 200 });
    }) as typeof fetch;

    expect(api("test.call", {}, mockFetch)).rejects.toThrow(
      "Invalid JSON response from upstream",
    );
  });
});
