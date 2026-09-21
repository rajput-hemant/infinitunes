import { describe, expect, it } from "bun:test";

import { getDownloadLink, getImageSrc } from "../src/media";

const SONG_IMAGE =
  "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-150x150.jpg";
const ARTIST_IMAGE = "https://c.saavncdn.com/artists/Sia_002_150x150.jpg";

describe("getImageSrc", () => {
  it("returns the raw URL untouched when no quality is requested", () => {
    expect(getImageSrc(SONG_IMAGE)).toBe(SONG_IMAGE);
  });

  it("resizes hyphen-separated resolution tokens", () => {
    expect(getImageSrc(SONG_IMAGE, "high")).toBe(
      "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-500x500.jpg",
    );
    expect(getImageSrc(SONG_IMAGE, "low")).toBe(
      "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-50x50.jpg",
    );
  });

  it("resizes underscore-separated resolution tokens", () => {
    expect(getImageSrc(ARTIST_IMAGE, "high")).toBe(
      "https://c.saavncdn.com/artists/Sia_002_500x500.jpg",
    );
  });

  it("honours an explicit width override", () => {
    expect(getImageSrc(ARTIST_IMAGE, "high", 750)).toContain("_750x750.jpg");
  });

  it("upgrades http to https", () => {
    expect(getImageSrc("http://c.saavncdn.com/a-150x150.jpg", "high")).toBe(
      "https://c.saavncdn.com/a-500x500.jpg",
    );
  });

  it("leaves URLs without a resolution token alone", () => {
    const url = "https://c.saavncdn.com/default.jpg";
    expect(getImageSrc(url, "high")).toBe(url);
  });
});

describe("getDownloadLink", () => {
  const links = [
    "https://aac.saavncdn.com/t/x_12.mp4",
    "https://aac.saavncdn.com/t/x_48.mp4",
    "https://aac.saavncdn.com/t/x_96.mp4",
    "https://aac.saavncdn.com/t/x_160.mp4",
    "https://aac.saavncdn.com/t/x_320.mp4",
  ].join(",");

  it("selects a single URL for the requested stream quality", () => {
    expect(getDownloadLink(links, "poor")).toBe(
      "https://aac.saavncdn.com/t/x_12.mp4",
    );
    expect(getDownloadLink(links, "medium")).toBe(
      "https://aac.saavncdn.com/t/x_96.mp4",
    );
    expect(getDownloadLink(links, "excellent")).toBe(
      "https://aac.saavncdn.com/t/x_320.mp4",
    );
  });

  it("never returns the whole comma-separated list", () => {
    expect(getDownloadLink(links, "high")).not.toContain(",");
  });

  it("falls back to the highest bitrate when quality is unknown", () => {
    expect(getDownloadLink(links)).toBe("https://aac.saavncdn.com/t/x_320.mp4");
  });

  it("returns an empty string when there is no download url", () => {
    expect(getDownloadLink("")).toBe("");
  });

  it("returns an empty string for non-string input (undefined download_url)", () => {
    expect(getDownloadLink(undefined)).toBe("");
    expect(getDownloadLink(null)).toBe("");
  });

  it("returns an empty string when every split segment is blank", () => {
    expect(getDownloadLink(" , , ")).toBe("");
  });
});
