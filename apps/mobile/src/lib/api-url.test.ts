import { parseApiUrl } from "./api-url";

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
