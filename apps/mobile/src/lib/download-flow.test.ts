import { downloadLadder } from "@infinitunes/types/fixtures";
import { Directory, File } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { Platform } from "react-native";

import { downloadTrack, pickDownloadFolder, saveTracks } from "./download";

type MockWritten = { name: string; mime: string | null };
const mockCreated: MockWritten[] = [];
const mockDeleted: string[] = [];
let mockWriteFails = false;

jest.mock("expo-file-system", () => {
  class MockFile {
    static downloadFileAsync = jest.fn(
      async (_url: string, destination: MockFile) => destination,
    );
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join("/");
    }
    bytes = jest.fn(async () => new Uint8Array([1]));
    delete = jest.fn(() => void mockDeleted.push(this.uri));
  }
  class MockDirectory {
    static pickDirectoryAsync = jest.fn();
    createFile(name: string, mime: string | null) {
      mockCreated.push({ name, mime });
      return {
        write: async () => {
          if (mockWriteFails) throw new Error("disk full");
        },
      };
    }
  }
  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: { cache: "cache" },
  };
});
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn() }));

const track = (
  overrides: Partial<Parameters<typeof downloadTrack>[0]> = {},
) => ({
  name: "FA9LA",
  download_url: downloadLadder("songs/fa9la"),
  ...overrides,
});

const requestedUrl = () =>
  jest.mocked(File.downloadFileAsync).mock.calls.at(-1)?.[0];

beforeEach(() => {
  mockCreated.length = 0;
  mockDeleted.length = 0;
  mockWriteFails = false;
  jest.clearAllMocks();
});

describe("downloadTrack", () => {
  it("downloads the bitrate asked for and hands the file to the share sheet", async () => {
    await downloadTrack(track(), "excellent");

    expect(requestedUrl()).toBe("https://aac.saavncdn.com/songs/fa9la_320.mp4");
    expect(shareAsync).toHaveBeenCalledWith("cache/FA9LA.mp4", {
      mimeType: "audio/mp4",
      UTI: "public.mpeg-4-audio",
      dialogTitle: "FA9LA",
    });
  });

  it("steps down to what the song has when it has no 320kbps", async () => {
    await downloadTrack(track({ maxQuality: "high" }), "excellent");

    expect(requestedUrl()).toBe("https://aac.saavncdn.com/songs/fa9la_160.mp4");
  });

  it("rejects without a link, and never reaches the share sheet", async () => {
    await expect(
      downloadTrack(track({ download_url: "" }), "high"),
    ).rejects.toThrow("This song can't be downloaded right now.");

    expect(File.downloadFileAsync).not.toHaveBeenCalled();
    expect(shareAsync).not.toHaveBeenCalled();
  });

  it("rejects when the CDN refuses, without sharing", async () => {
    for (let i = 0; i < 4; i += 1) {
      jest
        .mocked(File.downloadFileAsync)
        .mockRejectedValueOnce(new Error("404"));
    }

    await expect(downloadTrack(track(), "high")).rejects.toThrow("404");
    expect(shareAsync).not.toHaveBeenCalled();
  });

  it("names the file after the song with the characters a file system rejects removed", async () => {
    await downloadTrack(track({ name: 'AC/DC: "Back in Black"?' }), "low");

    expect(shareAsync).toHaveBeenCalledWith(
      "cache/ACDC Back in Black.mp4",
      expect.anything(),
    );
  });

  it("falls back to 'track' for a name of only unsupported characters", async () => {
    await downloadTrack(track({ name: "???" }), "low");

    expect(shareAsync).toHaveBeenCalledWith(
      "cache/track.mp4",
      expect.anything(),
    );
  });
});

describe("saveTracks", () => {
  it("cleans the cached download up after saving it", async () => {
    await expect(
      saveTracks(new Directory(), [track()], "high"),
    ).resolves.toEqual({ saved: 1, failed: 0 });

    expect(mockDeleted).toEqual(["cache/FA9LA.mp4"]);
  });

  it("counts a failed write and still cleans the cache up", async () => {
    mockWriteFails = true;

    await expect(
      saveTracks(new Directory(), [track()], "high"),
    ).resolves.toEqual({ saved: 0, failed: 1 });

    expect(mockDeleted).toEqual(["cache/FA9LA.mp4"]);
  });

  it("saves an empty list as nothing saved", async () => {
    await expect(saveTracks(new Directory(), [], "high")).resolves.toEqual({
      saved: 0,
      failed: 0,
    });
    expect(mockCreated).toEqual([]);
  });

  it("leaves the extension to Android's document provider", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    try {
      await saveTracks(new Directory(), [track()], "high");
    } finally {
      jest.restoreAllMocks();
    }

    expect(mockCreated).toEqual([{ name: "FA9LA", mime: "audio/mp4" }]);
  });

  it("names the file with its extension on iOS", async () => {
    await saveTracks(new Directory(), [track()], "high");

    expect(mockCreated).toEqual([{ name: "FA9LA.mp4", mime: "audio/mp4" }]);
  });
});

describe("pickDownloadFolder", () => {
  it("is the folder the listener picked", async () => {
    const folder = new Directory();
    jest.mocked(Directory.pickDirectoryAsync).mockResolvedValueOnce(folder);

    await expect(pickDownloadFolder()).resolves.toBe(folder);
  });
});
