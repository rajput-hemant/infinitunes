import { describe, expect, it } from "bun:test";

import { mapDownloadUrls } from "../src/router/utils";

describe("mapDownloadUrls", () => {
  it("is a no-op for non-records, missing keys and non-array values", () => {
    expect(() => mapDownloadUrls(null, "songs")).not.toThrow();
    expect(() => mapDownloadUrls("x", "songs")).not.toThrow();
    const value: Record<string, unknown> = { songs: "nope", other: [] };
    mapDownloadUrls(value, "songs");
    mapDownloadUrls(value, "missing");
    expect(value).toEqual({ songs: "nope", other: [] });
  });

  it("keeps non-record entries and entries without media in place", () => {
    const value: Record<string, unknown> = {
      songs: [null, "s", { id: "1" }, { id: "2", more_info: {} }],
    };
    mapDownloadUrls(value, "songs");
    expect(value.songs).toEqual([
      null,
      "s",
      { id: "1" },
      { id: "2", more_info: {} },
    ]);
  });
});
