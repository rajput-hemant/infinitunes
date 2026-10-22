import { parseApiUrl, resolveDevApiUrl } from "./api-url";

describe("parseApiUrl", () => {
  it("returns the origin, dropping any path and trailing slash", () => {
    expect(parseApiUrl("https://infinitunes.example.com/")).toBe(
      "https://infinitunes.example.com",
    );
    expect(parseApiUrl("http://192.168.1.10:3000/api")).toBe(
      "http://192.168.1.10:3000",
    );
  });

  it("explains a missing value", () => {
    expect(() => parseApiUrl(undefined)).toThrow(/is not set/);
    expect(() => parseApiUrl("")).toThrow(/is not set/);
  });

  it("rejects malformed and non-http URLs", () => {
    expect(() => parseApiUrl("not a url")).toThrow(/not a valid URL/);
    expect(() => parseApiUrl("ftp://example.com")).toThrow(/http\(s\)/);
  });
});

describe("resolveDevApiUrl", () => {
  it("points a loopback API at Metro's host for a phone on Wi-Fi", () => {
    expect(resolveDevApiUrl("http://127.0.0.1:3000", "192.168.1.20:8081")).toBe(
      "http://192.168.1.20:3000",
    );
  });

  it("keeps loopback when Metro is loopback too (simulator, adb reverse)", () => {
    expect(resolveDevApiUrl("http://127.0.0.1:3000", "127.0.0.1:8081")).toBe(
      "http://127.0.0.1:3000",
    );
    expect(resolveDevApiUrl("http://localhost:3000", undefined)).toBe(
      "http://localhost:3000",
    );
  });

  it("leaves a real host alone", () => {
    expect(
      resolveDevApiUrl("https://infinitunes.app", "192.168.1.20:8081"),
    ).toBe("https://infinitunes.app");
  });
});
